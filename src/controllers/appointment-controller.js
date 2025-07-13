const { Appointment, GuestPatient, User, Disponibilidad, ServiceType, Especialidad } = require('../models');
const { createGuestAppointmentSchema, createUserAppointmentSchema, updateAppointmentStatusSchema } = require('../dtos');
const { validateAppointmentCreation, ValidationError } = require('../utils/appointment-validations');
const { sendAppointmentConfirmationEmail } = require('../utils/mailer');
const { verifyConfirmationToken } = require('../utils/confirmation-token');
const { verifyRecaptcha} = require('./auth-controller')


const appointmentController = {
  
  
  // Crear cita como paciente invitado (lógica atómica)
  async createGuestAppointment(req, res) {
    const t = await Appointment.sequelize.transaction();
    try {

       const { captchaToken } = req.body;

        // 1. Llama a tu función de verificación
        const recaptchaResult = await verifyRecaptcha(captchaToken);

        // 2. AÑADE ESTA VALIDACIÓN MEJORADA
        if (!recaptchaResult || !recaptchaResult.success) {
            // Si Google dice que la verificación falló (token inválido, etc.)
            return res.status(400).json({ error: "Verificación de reCAPTCHA fallida. Intenta de nuevo." });
        }

        if (recaptchaResult.score < 0.5) {
            // Si el puntaje es muy bajo, es probablemente un bot. 0.5 es un umbral común.
            console.warn(`Puntaje de reCAPTCHA bajo detectado: ${recaptchaResult.score}`);
            return res.status(403).json({ error: "Actividad sospechosa detectada." });
        }
      // 1. Validar el payload combinado (paciente + cita)
      const { error, value } = createGuestAppointmentSchema.validate(req.body);
      if (error) {
        console.warn('Intento fallido de agendar cita (validación Joi):', error.details.map(detail => detail.message));
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { guest_patient, disponibilidad_id, service_type_id, preferred_date, notes } = value;

      // 1.1 Validar formato de teléfono (simple regex, puedes ajustar a tu país)
      const phoneRegex = /^\+?\d{7,15}$/;
      if (!phoneRegex.test(guest_patient.phone)) {
        console.warn('Intento fallido de agendar cita (teléfono inválido):', guest_patient.phone);
        return res.status(400).json({
          success: false,
          message: 'El teléfono proporcionado no es válido. Debe tener entre 7 y 15 dígitos y puede incluir +.'
        });
      }

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
        // Si el paciente está inactivo, lo reactivamos
        if (!patient.is_active) {
          patient.is_active = true;
        }
        // Actualizar datos si el paciente ya existía
        patient.name = guest_patient.name;
        patient.phone = guest_patient.phone;
        await patient.save({ transaction: t });
      }

      // 2.1 Limitar máximo 3 citas pendientes/confirmadas por paciente invitado
      const activeAppointmentsCount = await Appointment.count({
        where: {
          guest_patient_id: patient.id,
          status: ['pending', 'confirmed']
        },
        transaction: t
      });
      if (activeAppointmentsCount >= 3) {
        console.warn('Intento fallido de agendar cita (límite de citas activas alcanzado):', patient.email);
        return res.status(429).json({
          success: false,
          message: 'Has alcanzado el límite de 3 citas activas (pendientes o confirmadas). Por favor, completa o cancela alguna antes de agendar otra.'
        });
      }

      // 3. Validar que la cita no se agende en el pasado (comparando strings)
      const today = new Date().toISOString().split('T')[0];
      if (preferred_date < today) {
        console.warn('Intento fallido de agendar cita (fecha pasada):', preferred_date);
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
        console.warn('Intento fallido de agendar cita (disponibilidad no encontrada):', disponibilidad_id);
        return res.status(404).json({ success: false, message: 'Disponibilidad no encontrada' });
      }

      const existingAppointment = await Appointment.findOne({
        where: { disponibilidad_id },
        transaction: t
      });

      if (existingAppointment) {
        console.warn('Intento fallido de agendar cita (horario ya no disponible):', disponibilidad_id);
        return res.status(409).json({ success: false, message: 'Este horario ya no está disponible.' });
      }

      const expectedDate = new Date(disponibilidad.date).toISOString().split('T')[0];
      if (expectedDate !== preferred_date) {
        console.warn('Intento fallido de agendar cita (fecha no coincide con disponibilidad):', preferred_date, expectedDate);
        return res.status(400).json({
          success: false,
          message: `La fecha proporcionada (${preferred_date}) no coincide con la fecha del horario seleccionado (${expectedDate}).`
        });
      }

      // 5. Validar el tipo de servicio y la duración
      const serviceType = await ServiceType.findByPk(service_type_id, { transaction: t });
      if (!serviceType) {
        console.warn('Intento fallido de agendar cita (tipo de servicio no encontrado):', service_type_id);
        return res.status(404).json({ success: false, message: 'Tipo de servicio no encontrado' });
      }

      const startTime = new Date(`1970-01-01T${disponibilidad.start_time}`);
      const endTime = new Date(`1970-01-01T${disponibilidad.end_time}`);
      const slotDuration = (endTime - startTime) / (1000 * 60);

      if (serviceType.duration > slotDuration) {
        console.warn('Intento fallido de agendar cita (servicio requiere más tiempo que el slot):', serviceType.duration, slotDuration);
        return res.status(400).json({ success: false, message: `El servicio requiere ${serviceType.duration} min, pero el espacio es de ${slotDuration} min.` });
      }

      // 5.1 Prevenir doble booking por paciente invitado
      const horaCita = disponibilidad.start_time.split(':').slice(0, 2).join(':');
      const conflictingAppointment = await Appointment.findOne({
        where: {
          guest_patient_id: patient.id,
          preferred_date,
          preferred_time: horaCita,
          status: ['pending', 'confirmed']
        },
        transaction: t
      });
      if (conflictingAppointment) {
        console.warn('Intento fallido de agendar cita (doble booking):', patient.email, preferred_date, horaCita);
        return res.status(409).json({
          success: false,
          message: 'Ya tienes una cita pendiente o confirmada para ese horario.'
        });
      }

      // 6. Crear la cita
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

      // 8. Enviar correo de confirmación (fuera de la transacción)
      const emailDetails = {
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientIdNumber: guest_patient.id_number || null,
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
        await sendAppointmentConfirmationEmail(patient.email, emailDetails, process.env.BASE_URL || 'http://localhost:3000');
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
      }

      // 9. Enviar respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente. Recuerda confirmar tu cita desde el correo que te enviamos.',
        data: { id: appointment.id }
      });

    } catch (error) {
      await t.rollback();
      console.error('Error al crear cita de invitado:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },


  // Crear cita como usuario registrado
  async createUserAppointment(req, res) {
    const t = await Appointment.sequelize.transaction();
    try {
      // 1. Validar datos de entrada
      const { error, value } = createUserAppointmentSchema.validate(req.body);
      if (error) {
        console.warn('Intento fallido de agendar cita (validación Joi):', error.details.map(detail => detail.message));
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { patient_id, disponibilidad_id, service_type_id, preferred_date, notes } = value;

      // 2. Verificar que el paciente sea el usuario autenticado (seguridad)
      if (patient_id !== req.user.id) {
        console.warn('Intento fallido de agendar cita (autorización):', req.user.id, 'intentó crear cita para', patient_id);
        return res.status(403).json({
          success: false,
          error: 'No autorizado para crear citas para otros pacientes'
        });
      }

      // 3. Verificar que el paciente existe
      const patient = await User.findByPk(patient_id, { transaction: t });
      if (!patient) {
        console.warn('Intento fallido de agendar cita (paciente no encontrado):', patient_id);
        return res.status(404).json({
          success: false,
          error: 'Paciente no encontrado'
        });
      }

      // 4. Validar que la fecha sea futura
      const today = new Date().toISOString().split('T')[0];
      if (preferred_date <= today) {
        console.warn('Intento fallido de agendar cita (fecha pasada):', preferred_date);
        return res.status(400).json({
          success: false,
          error: 'La fecha debe ser futura'
        });
      }

      // 5. Validar la disponibilidad
      const disponibilidad = await Disponibilidad.findByPk(disponibilidad_id, {
        include: [
          { model: Especialidad, as: 'especialidad' },
          { model: User, as: 'dentist', attributes: ['id', 'name'] }
        ],
        transaction: t
      });

      if (!disponibilidad) {
        console.warn('Intento fallido de agendar cita (disponibilidad no encontrada):', disponibilidad_id);
        return res.status(404).json({
          success: false,
          error: 'Disponibilidad no encontrada'
        });
      }

      // 6. Verificar que la disponibilidad esté libre
      const existingAppointment = await Appointment.findOne({
        where: { disponibilidad_id },
        transaction: t
      });

      if (existingAppointment) {
        console.warn('Intento fallido de agendar cita (horario ya no disponible):', disponibilidad_id);
        return res.status(400).json({
          success: false,
          error: 'La disponibilidad seleccionada no está disponible'
        });
      }

      // 7. Verificar que la fecha coincida con la disponibilidad
      const expectedDate = new Date(disponibilidad.date).toISOString().split('T')[0];
      if (expectedDate !== preferred_date) {
        console.warn('Intento fallido de agendar cita (fecha no coincide con disponibilidad):', preferred_date, expectedDate);
        return res.status(400).json({
          success: false,
          error: `La fecha proporcionada (${preferred_date}) no coincide con la fecha del horario seleccionado (${expectedDate})`
        });
      }

      // 8. Validar el tipo de servicio
      const serviceType = await ServiceType.findByPk(service_type_id, { transaction: t });
      if (!serviceType) {
        console.warn('Intento fallido de agendar cita (tipo de servicio no encontrado):', service_type_id);
        return res.status(404).json({
          success: false,
          error: 'Tipo de servicio no encontrado'
        });
      }

      // 9. Verificar compatibilidad entre servicio y especialidad
      if (serviceType.especialidad_id !== disponibilidad.especialidad_id) {
        console.warn('Intento fallido de agendar cita (servicio no compatible con especialidad):', service_type_id, disponibilidad.especialidad_id);
        return res.status(400).json({
          success: false,
          error: 'El tipo de servicio no corresponde a la especialidad de la disponibilidad'
        });
      }

      // 10. Verificar duración del servicio vs slot disponible
      const startTime = new Date(`1970-01-01T${disponibilidad.start_time}`);
      const endTime = new Date(`1970-01-01T${disponibilidad.end_time}`);
      const slotDuration = (endTime - startTime) / (1000 * 60);

      if (serviceType.duration > slotDuration) {
        console.warn('Intento fallido de agendar cita (servicio requiere más tiempo que el slot):', serviceType.duration, slotDuration);
        return res.status(400).json({
          success: false,
          error: `El servicio requiere ${serviceType.duration} min, pero el espacio es de ${slotDuration} min`
        });
      }

      // 11. Prevenir doble booking por paciente registrado
      const horaCita = disponibilidad.start_time.split(':').slice(0, 2).join(':');
      const conflictingAppointment = await Appointment.findOne({
        where: {
          user_id: patient_id,
          preferred_date,
          preferred_time: horaCita,
          status: ['pending', 'confirmed']
        },
        transaction: t
      });

      if (conflictingAppointment) {
        console.warn('Intento fallido de agendar cita (doble booking):', patient_id, preferred_date, horaCita);
        return res.status(409).json({
          success: false,
          error: 'Ya tienes una cita pendiente o confirmada para ese horario'
        });
      }

      // 12. Limitar máximo 5 citas activas por paciente registrado
      const activeAppointmentsCount = await Appointment.count({
        where: {
          user_id: patient_id,
          status: ['pending', 'confirmed']
        },
        transaction: t
      });

      if (activeAppointmentsCount >= 5) {
        console.warn('Intento fallido de agendar cita (límite de citas activas alcanzado):', patient_id);
        return res.status(429).json({
          success: false,
          error: 'Has alcanzado el límite de 5 citas activas (pendientes o confirmadas). Por favor, completa o cancela alguna antes de agendar otra'
        });
      }

      // 13. Crear la cita
      const appointment = await Appointment.create({
        user_id: patient_id,
        disponibilidad_id,
        service_type_id,
        preferred_date,
        preferred_time: horaCita,
        status: 'pending',
        appointment_type: 'registered',
        notes: notes || null
      }, { transaction: t });

      // 14. Confirmar la transacción
      await t.commit();

      // 15. Enviar correo de confirmación (fuera de la transacción)
      const emailDetails = {
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone || null,
        patientIdNumber: patient.id_number || null,
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
        await sendAppointmentConfirmationEmail(patient.email, emailDetails, process.env.BASE_URL || 'http://localhost:3000');
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
      }

      // 16. Retornar respuesta exitosa según especificaciones
      res.status(201).json({
        success: true,
        data: {
          id: appointment.id,
          patient_id: appointment.user_id,
          disponibilidad_id: appointment.disponibilidad_id,
          service_type_id: appointment.service_type_id,
          preferred_date: appointment.preferred_date,
          notes: appointment.notes,
          status: appointment.status,
          created_at: appointment.createdAt,
          updated_at: appointment.updatedAt
        },
        message: 'Cita creada exitosamente'
      });

    } catch (error) {
      await t.rollback();
      console.error('Error al crear cita como usuario registrado:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
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
            as: 'disponibilidad',
            include: [{ model: Especialidad, as: 'especialidad' }]
          },
          {
            model: ServiceType,
            as: 'serviceType'
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
            as: 'guestPatient',
            attributes: ['id', 'name', 'phone', 'email']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Disponibilidad,
            as: 'disponibilidad',
            include: [{ model: Especialidad, as: 'especialidad' }]
          },
          {
            model: ServiceType,
            as: 'serviceType'
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
            as: 'guestPatient',
            attributes: ['id', 'name', 'phone', 'email']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Disponibilidad,
            as: 'disponibilidad',
            include: [{ model: Especialidad, as: 'especialidad' }]
          },
          {
            model: ServiceType,
            as: 'serviceType'
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
  },

  // Confirmar cita mediante email (endpoint público)
  async confirmAppointmentByEmail(req, res) {
    try {
      const { id } = req.params;
      const { token, email } = req.query;

      // Validar parámetros requeridos
      if (!token || !email) {
        return res.status(400).json({
          success: false,
          message: 'Token y email son requeridos para confirmar la cita'
        });
      }

      // Buscar la cita
      const appointment = await Appointment.findByPk(id, {
        include: [
          {
            model: GuestPatient,
            as: 'guestPatient',
            attributes: ['id', 'name', 'phone', 'email']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Disponibilidad,
            as: 'disponibilidad',
            include: [{ model: Especialidad, as: 'especialidad' }]
          },
          {
            model: ServiceType,
            as: 'serviceType'
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Verificar que el email coincida con el paciente de la cita
      const patientEmail = appointment.guestPatient?.email || appointment.user?.email;
      if (patientEmail !== email) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para confirmar esta cita'
        });
      }

      // Verificar el token (aquí podrías implementar una verificación más robusta)
      if (!verifyConfirmationToken(token, id, email)) {
        return res.status(403).json({
          success: false,
          message: 'Token de confirmación inválido o expirado'
        });
      }

      // Verificar que la cita esté en estado pendiente
      if (appointment.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `La cita ya no está pendiente. Estado actual: ${appointment.status}`
        });
      }

      // Confirmar la cita
      await appointment.update({ status: 'confirmed' });

      // Preparar datos para el correo de confirmación exitosa
      const patientName = appointment.guestPatient?.name || appointment.user?.name;
      const doctorName = appointment.disponibilidad?.dentist?.name || 'Doctor';
      const specialtyName = appointment.disponibilidad?.especialidad?.name || 'Especialidad';
      const serviceTypeName = appointment.serviceType?.name || 'Servicio';

      // Enviar correo de confirmación exitosa
      try {
        await sendAppointmentConfirmationEmail(patientEmail, {
          patientName,
          patientEmail,
          patientPhone: appointment.guestPatient?.phone || appointment.user?.phone || '',
          patientIdNumber: null,
          patientNotes: appointment.notes,
          doctorName,
          specialtyName,
          serviceTypeName,
          serviceTypeDescription: appointment.serviceType?.description || '',
          serviceTypeDuration: appointment.serviceType?.duration || 0,
          appointmentDate: appointment.preferred_date,
          appointmentStartTime: appointment.preferred_time,
          appointmentEndTime: appointment.disponibilidad?.end_time || '',
          appointmentId: appointment.id
        }, process.env.BASE_URL || 'http://localhost:3000');
      } catch (emailError) {
        console.error('Error al enviar correo de confirmación exitosa:', emailError);
        // No fallamos la operación si el correo falla
      }

      // Retornar respuesta exitosa con HTML para mostrar en el navegador
      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cita Confirmada - Odontologic</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              background-color: #F5F5F5;
              margin: 0;
              padding: 20px;
              color: #004D40;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #009688;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #ffffff;
              font-size: 24px;
              margin: 0;
            }
            .content {
              padding: 30px;
              text-align: center;
            }
            .success-icon {
              font-size: 64px;
              color: #4caf50;
              margin-bottom: 20px;
            }
            .success-title {
              color: #004D40;
              font-size: 24px;
              margin-bottom: 15px;
            }
            .success-message {
              font-size: 16px;
              line-height: 1.6;
              color: #004D40;
              margin-bottom: 30px;
            }
            .appointment-details {
              background-color: #F5F5F5;
              border-left: 4px solid #009688;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: left;
            }
            .footer {
              background-color: #004D40;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 8px 8px;
            }
            .footer p {
              color: #ffffff;
              font-size: 12px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Odontologic</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2 class="success-title">¡Cita Confirmada Exitosamente!</h2>
              <p class="success-message">
                Tu cita ha sido confirmada. Hemos enviado un correo de confirmación a tu dirección de email.
              </p>
              <div class="appointment-details">
                <h3>Detalles de la Cita #${appointment.id}</h3>
                <p><strong>Paciente:</strong> ${patientName}</p>
                <p><strong>Doctor:</strong> ${doctorName} (${specialtyName})</p>
                <p><strong>Servicio:</strong> ${serviceTypeName}</p>
                <p><strong>Fecha:</strong> ${new Date(appointment.preferred_date).toLocaleDateString('es-CO', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</p>
                <p><strong>Hora:</strong> ${appointment.preferred_time}</p>
              </div>
              <p style="font-size: 14px; color: #666;">
                Puedes cerrar esta ventana. Recibirás un correo con todos los detalles de tu cita.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Odontologic. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse);

    } catch (error) {
      console.error('Error al confirmar cita por email:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = appointmentController; 