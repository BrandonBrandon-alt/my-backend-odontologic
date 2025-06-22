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

      // Validar todos los aspectos de la cita
      const { disponibilidad, serviceType } = await validateAppointmentCreation(
        value.disponibilidad_id,
        value.service_type_id,
        value.preferred_date,
        value.preferred_time
      );

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

}

module.exports = appointmentController; 