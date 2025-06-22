const { Appointment, GuestPatient, User, Disponibilidad, ServiceType, Especialidad } = require('../models');
const { createGuestAppointmentSchema, createUserAppointmentSchema, updateAppointmentStatusSchema } = require('../dtos');
const { validateAppointmentCreation, ValidationError } = require('../utils/appointment-validations');

const appointmentController = {
  // Crear cita como paciente invitado
  async createGuestAppointment(req, res) {
    try {
      // Validar datos de entrada
      const { error, value } = createGuestAppointmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }
  
      // Verificar que el paciente invitado existe
      const guestPatient = await GuestPatient.findByPk(value.guest_patient_id);
      if (!guestPatient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente invitado no encontrado'
        });
      }
  
      // Obtener la disponibilidad
      const disponibilidad = await Disponibilidad.findByPk(value.disponibilidad_id, {
        include: [{ model: Especialidad, as: 'especialidad' }]
      });
      
      if (!disponibilidad) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidad no encontrada'
        });
      }
  
      // Usar la hora de inicio de la disponibilidad (ignorar preferred_time del frontend)
      const horaCita = disponibilidad.start_time.split(':').slice(0, 2).join(':');
  
      // Obtener el tipo de servicio
      const serviceType = await ServiceType.findByPk(value.service_type_id);
      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de servicio no encontrado'
        });
      }
  
      // Crear la cita con la hora correcta
      const appointment = await Appointment.create({
        guest_patient_id: value.guest_patient_id,
        disponibilidad_id: value.disponibilidad_id,
        service_type_id: value.service_type_id,
        preferred_date: value.preferred_date,
        preferred_time: horaCita, // ← Usar hora de la disponibilidad
        status: 'pending',
        appointment_type: 'guest',
        notes: value.notes || null
      });
  
      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: {
          id: appointment.id,
          guest_patient: {
            id: guestPatient.id,
            name: guestPatient.name,
            phone: guestPatient.phone,
            email: guestPatient.email
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
          preferred_time: appointment.preferred_time, // ← Hora corregida
          status: appointment.status,
          appointment_type: appointment.appointment_type,
          notes: appointment.notes
        }
      });
  
    } catch (error) {
      console.error('Error al crear cita como invitado:', error);
      
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