const { Appointment, GuestPatient, User, Disponibilidad, ServiceType, Especialidad } = require('../models');
const { createGuestAppointmentSchema, createUserAppointmentSchema, updateAppointmentStatusSchema } = require('../dtos');
const { validateAppointmentCreation, ValidationError } = require('../utils/appointment-validations');
const { sendAppointmentConfirmationEmail } = require('../utils/mailer');

const appointmentController = {
  // Crear cita como paciente invitado (lógica atómica)
  async createGuestAppointment(req, res) {
    const t = await Appointment.sequelize.transaction();

    try {
      // 1. Validar el payload combinado (paciente + cita)
      const { error, value } = createGuestAppointmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { guest_patient, disponibilidad_id, service_type_id, preferred_date, notes } = value;

      // 2. Buscar o crear al paciente invitado dentro de la transacción
      let patient = await GuestPatient.findOne({
        where: { email: guest_patient.email },
        transaction: t
      });

      if (!patient) {
        patient = await GuestPatient.create({
          name: guest_patient.name,
          email: guest_patient.email,
          phone: guest_patient.phone,
          is_active: true
        }, { transaction: t });
      } else {
        // Opcional: Actualizar datos si el paciente ya existía
        patient.name = guest_patient.name;
        patient.phone = guest_patient.phone;
        await patient.save({ transaction: t });
      }

      // 3. Validar que la cita no se agende en el pasado (comparando strings)
      const today = new Date().toISOString().split('T')[0];
      if (preferred_date < today) {
        return res.status(400).json({
          success: false,
          message: 'No se puede agendar una cita en una fecha pasada.'
        });
      }

      // 4. Validar la disponibilidad
      const disponibilidad = await Disponibilidad.findByPk(disponibilidad_id, {
        include: [
          { model: Especialidad, as: 'especialidad' },
          { model: User, as: 'dentist', attributes: ['id', 'name'] }
        ],
        transaction: t
      });

      if (!disponibilidad) {
        return res.status(404).json({ success: false, message: 'Disponibilidad no encontrada' });
      }

      const existingAppointment = await Appointment.findOne({
        where: { disponibilidad_id },
        transaction: t
      });

      if (existingAppointment) {
        return res.status(409).json({ success: false, message: 'Este horario ya no está disponible.' });
      }

      const expectedDate = new Date(disponibilidad.date).toISOString().split('T')[0];
      if (expectedDate !== preferred_date) {
        return res.status(400).json({
          success: false,
          message: `La fecha proporcionada (${preferred_date}) no coincide con la fecha del horario seleccionado (${expectedDate}).`
        });
      }

      // 5. Validar el tipo de servicio y la duración
      const serviceType = await ServiceType.findByPk(service_type_id, { transaction: t });
      if (!serviceType) {
        return res.status(404).json({ success: false, message: 'Tipo de servicio no encontrado' });
      }

      const startTime = new Date(`1970-01-01T${disponibilidad.start_time}`);
      const endTime = new Date(`1970-01-01T${disponibilidad.end_time}`);
      const slotDuration = (endTime - startTime) / (1000 * 60);

      if (serviceType.duration > slotDuration) {
        return res.status(400).json({ success: false, message: `El servicio requiere ${serviceType.duration} min, pero el espacio es de ${slotDuration} min.` });
      }

      // 6. Crear la cita
      const horaCita = disponibilidad.start_time.split(':').slice(0, 2).join(':');
      const appointment = await Appointment.create({
        guest_patient_id: patient.id,
        disponibilidad_id,
        service_type_id,
        preferred_date,
        preferred_time: horaCita,
        status: 'pending',
        appointment_type: 'guest',
        notes: notes || null
      }, { transaction: t });

      // 7. Si todo es correcto, confirmar la transacción
      await t.commit();
     


      // Preparar los datos completos para el correo de confirmación


      // 8. Enviar correo de confirmación (fuera de la transacción)
      const emailDetails = {
        patientEmail: patient.email, // CORREGIDO: Usar 'patient' en lugar de 'guestPatient'
        patientPhone: patient.phone, // CORREGIDO: Usar 'patient' en lugar de 'guestPatient'
        patientIdNumber: guest_patient.id_number || null, // Del payload de entrada, ya que puede no estar en el modelo patient si es invitado
        patientNotes: appointment.notes || null,
        doctorName: disponibilidad.dentist.name,
        specialtyName: disponibilidad.especialidad.name,
        serviceTypeName: serviceType.name,
        serviceTypeDescription: serviceType.description || '',
        serviceTypeDuration: serviceType.duration,
        appointmentDate: appointment.preferred_date,
        appointmentStartTime: appointment.preferred_time,
        appointmentEndTime: disponibilidad.end_time,
        appointmentId: appointment.id
      };
      try {
        await sendAppointmentConfirmationEmail(patient.email, emailDetails);
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
      }

      // 9. Enviar respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: { id: appointment.id /* ... más datos si son necesarios ... */ }
      });

    } catch (error) {
      await t.rollback();
      console.error('Error al crear cita de invitado:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },


  // Crear cita como usuario registrado
  async createUserAppointment(req, res) {
    try {
      // Validar datos de entrada
      const { error, value } = createUserAppointmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Validar todos los aspectos de la cita
      const { disponibilidad, serviceType } = await validateAppointmentCreation(
        value.disponibilidad_id,
        value.service_type_id,
        value.preferred_date,
        value.preferred_time
      );

      // Crear la cita
      const appointment = await Appointment.create({
        user_id: req.user.id,
        disponibilidad_id: value.disponibilidad_id,
        service_type_id: value.service_type_id,
        preferred_date: value.preferred_date,
        preferred_time: value.preferred_time,
        status: 'pending',
        appointment_type: 'user',
        notes: value.notes || null
      });

      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: {
          id: appointment.id,
          user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
          },
          disponibilidad: {
            id: disponibilidad.id,
            date: disponibilidad.date,
            start_time: disponibilidad.start_time,
            end_time: disponibilidad.end_time,
            especialidad: disponibilidad.especialidad.name
          },
          service_type: {
            id: serviceType.id,
            name: serviceType.name,
            duration: serviceType.duration
          },
          preferred_date: appointment.preferred_date,
          preferred_time: appointment.preferred_time,
          status: appointment.status,
          appointment_type: appointment.appointment_type,
          notes: appointment.notes
        }
      });

    } catch (error) {
      console.error('Error al crear cita como usuario:', error);

      // Manejar errores de validación específicos
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener citas del usuario autenticado
  async getUserAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: Disponibilidad,
            include: [{ model: Especialidad }]
          },
          {
            model: ServiceType
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Error al obtener citas del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas de citas
  async getAppointmentStats(req, res) {
    try {
      const totalAppointments = await Appointment.count();
      const pendingAppointments = await Appointment.count({ where: { status: 'pending' } });
      const confirmedAppointments = await Appointment.count({ where: { status: 'confirmed' } });
      const cancelledAppointments = await Appointment.count({ where: { status: 'cancelled' } });

      res.json({
        success: true,
        data: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          cancelled: cancelledAppointments
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener todas las citas (para administradores)
  async getAllAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        include: [
          {
            model: GuestPatient,
            attributes: ['id', 'name', 'phone', 'email']
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Disponibilidad,
            include: [{ model: Especialidad }]
          },
          {
            model: ServiceType
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Error al obtener todas las citas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener una cita específica
  async getById(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findByPk(id, {
        include: [
          {
            model: GuestPatient,
            attributes: ['id', 'name', 'phone', 'email']
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Disponibilidad,
            include: [{ model: Especialidad }]
          },
          {
            model: ServiceType
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Error al obtener cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar estado de una cita
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateAppointmentStatusSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const appointment = await Appointment.findByPk(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      await appointment.update({ status: value.status });

      res.json({
        success: true,
        message: 'Estado de cita actualizado exitosamente',
        data: {
          id: appointment.id,
          status: appointment.status
        }
      });
    } catch (error) {
      console.error('Error al actualizar estado de cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = appointmentController; 