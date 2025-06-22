const { Appointment, GuestPatient, User, Disponibilidad, ServiceType, Especialidad } = require('../models');
const createGuestAppointmentSchema = require('../dtos/create-guest-appointment-dto');
const createUserAppointmentSchema = require('../dtos/create-user-appointment-dto');
const updateAppointmentStatusSchema = require('../dtos/update-appointment-status-dto');

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
      const guestPatient = await GuestPatient.findOne({
        where: { id: value.guest_patient_id, is_active: true }
      });

      if (!guestPatient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente invitado no encontrado'
        });
      }

      // Verificar que la disponibilidad existe y está activa
      const disponibilidad = await Disponibilidad.findOne({
        where: { id: value.disponibilidad_id, is_active: true },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true }
          }
        ]
      });

      if (!disponibilidad) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidad no encontrada o inactiva'
        });
      }

      // Verificar que el tipo de servicio existe y está activo
      const serviceType = await ServiceType.findOne({
        where: { id: value.service_type_id, is_active: true },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true }
          }
        ]
      });

      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de servicio no encontrado o inactivo'
        });
      }

      // Verificar que el tipo de servicio corresponde a la especialidad de la disponibilidad
      if (serviceType.especialidad_id !== disponibilidad.especialidad_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de servicio no corresponde a la especialidad de la disponibilidad'
        });
      }

      // Verificar que la fecha y hora están dentro del rango de la disponibilidad
      const appointmentDate = new Date(value.preferred_date);
      const appointmentTime = value.preferred_time;
      const disponibilidadDate = new Date(disponibilidad.date);
      const disponibilidadStartTime = disponibilidad.start_time;
      const disponibilidadEndTime = disponibilidad.end_time;

      if (appointmentDate.getTime() !== disponibilidadDate.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de la cita debe coincidir con la fecha de disponibilidad'
        });
      }

      if (appointmentTime < disponibilidadStartTime || appointmentTime > disponibilidadEndTime) {
        return res.status(400).json({
          success: false,
          message: 'La hora de la cita debe estar dentro del rango de disponibilidad'
        });
      }

      // Verificar que no hay otra cita en el mismo horario
      const existingAppointment = await Appointment.findOne({
        where: {
          disponibilidad_id: value.disponibilidad_id,
          preferred_time: value.preferred_time,
          status: ['pending', 'confirmed']
        }
      });

      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cita en este horario'
        });
      }

      // Crear la cita
      const appointment = await Appointment.create({
        guest_patient_id: value.guest_patient_id,
        disponibilidad_id: value.disponibilidad_id,
        service_type_id: value.service_type_id,
        preferred_date: value.preferred_date,
        preferred_time: value.preferred_time,
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
          preferred_time: appointment.preferred_time,
          status: appointment.status,
          appointment_type: appointment.appointment_type,
          notes: appointment.notes
        }
      });

    } catch (error) {
      console.error('Error al crear cita como invitado:', error);
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

      // El usuario viene del middleware de autenticación
      const userId = req.user.id;

      // Verificar que la disponibilidad existe y está activa
      const disponibilidad = await Disponibilidad.findOne({
        where: { id: value.disponibilidad_id, is_active: true },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true }
          }
        ]
      });

      if (!disponibilidad) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidad no encontrada o inactiva'
        });
      }

      // Verificar que el tipo de servicio existe y está activo
      const serviceType = await ServiceType.findOne({
        where: { id: value.service_type_id, is_active: true },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true }
          }
        ]
      });

      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de servicio no encontrado o inactivo'
        });
      }

      // Verificar que el tipo de servicio corresponde a la especialidad de la disponibilidad
      if (serviceType.especialidad_id !== disponibilidad.especialidad_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de servicio no corresponde a la especialidad de la disponibilidad'
        });
      }

      // Verificar que la fecha y hora están dentro del rango de la disponibilidad
      const appointmentDate = new Date(value.preferred_date);
      const appointmentTime = value.preferred_time;
      const disponibilidadDate = new Date(disponibilidad.date);
      const disponibilidadStartTime = disponibilidad.start_time;
      const disponibilidadEndTime = disponibilidad.end_time;

      if (appointmentDate.getTime() !== disponibilidadDate.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de la cita debe coincidir con la fecha de disponibilidad'
        });
      }

      if (appointmentTime < disponibilidadStartTime || appointmentTime > disponibilidadEndTime) {
        return res.status(400).json({
          success: false,
          message: 'La hora de la cita debe estar dentro del rango de disponibilidad'
        });
      }

      // Verificar que no hay otra cita en el mismo horario
      const existingAppointment = await Appointment.findOne({
        where: {
          disponibilidad_id: value.disponibilidad_id,
          preferred_time: value.preferred_time,
          status: ['pending', 'confirmed']
        }
      });

      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cita en este horario'
        });
      }

      // Crear la cita
      const appointment = await Appointment.create({
        user_id: userId,
        disponibilidad_id: value.disponibilidad_id,
        service_type_id: value.service_type_id,
        preferred_date: value.preferred_date,
        preferred_time: value.preferred_time,
        status: 'pending',
        appointment_type: 'registered',
        notes: value.notes || null
      });

      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: {
          id: appointment.id,
          user_id: appointment.user_id,
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
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener citas de un usuario
  async getUserAppointments(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const whereClause = { user_id: userId };
      if (status) {
        whereClause.status = status;
      }

      const offset = (page - 1) * limit;

      const appointments = await Appointment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Disponibilidad,
            as: 'disponibilidad',
            include: [
              {
                model: Especialidad,
                as: 'especialidad'
              }
            ]
          },
          {
            model: ServiceType,
            as: 'serviceType'
          }
        ],
        order: [['preferred_date', 'ASC'], ['preferred_time', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          appointments: appointments.rows.map(appointment => ({
            id: appointment.id,
            preferred_date: appointment.preferred_date,
            preferred_time: appointment.preferred_time,
            status: appointment.status,
            appointment_type: appointment.appointment_type,
            notes: appointment.notes,
            especialidad: appointment.disponibilidad.especialidad.name,
            service_type: appointment.serviceType.name,
            duration: appointment.serviceType.duration
          })),
          pagination: {
            total: appointments.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(appointments.count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener citas del usuario:', error);
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

      // Verificar que el usuario puede modificar esta cita
      if (appointment.user_id && appointment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar esta cita'
        });
      }

      await appointment.update({
        status: value.status,
        notes: value.notes || appointment.notes
      });

      res.json({
        success: true,
        message: 'Estado de la cita actualizado exitosamente',
        data: {
          id: appointment.id,
          status: appointment.status,
          notes: appointment.notes
        }
      });

    } catch (error) {
      console.error('Error al actualizar estado de la cita:', error);
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

      const appointment = await Appointment.findOne({
        where: { id },
        include: [
          {
            model: GuestPatient,
            as: 'guestPatient'
          },
          {
            model: User,
            as: 'user'
          },
          {
            model: Disponibilidad,
            as: 'disponibilidad',
            include: [
              {
                model: Especialidad,
                as: 'especialidad'
              }
            ]
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

      // Verificar que el usuario puede ver esta cita
      if (appointment.user_id && appointment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta cita'
        });
      }

      res.json({
        success: true,
        data: {
          id: appointment.id,
          patient: appointment.guestPatient ? {
            id: appointment.guestPatient.id,
            name: appointment.guestPatient.name,
            phone: appointment.guestPatient.phone,
            email: appointment.guestPatient.email
          } : {
            id: appointment.user.id,
            name: appointment.user.name,
            phone: appointment.user.phone,
            email: appointment.user.email
          },
          disponibilidad: {
            id: appointment.disponibilidad.id,
            date: appointment.disponibilidad.date,
            start_time: appointment.disponibilidad.start_time,
            end_time: appointment.disponibilidad.end_time,
            especialidad: appointment.disponibilidad.especialidad.name
          },
          service_type: {
            id: appointment.serviceType.id,
            name: appointment.serviceType.name,
            duration: appointment.serviceType.duration
          },
          preferred_date: appointment.preferred_date,
          preferred_time: appointment.preferred_time,
          status: appointment.status,
          appointment_type: appointment.appointment_type,
          notes: appointment.notes,
          created_at: appointment.createdAt
        }
      });

    } catch (error) {
      console.error('Error al obtener cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = appointmentController; 