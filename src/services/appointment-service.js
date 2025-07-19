const { Appointment, GuestPatient, User, Disponibilidad, ServiceType, Especialidad } = require('../models');
const createGuestAppointmentSchema = require('../dtos/create-guest-appointment-dto');
const createUserAppointmentSchema = require('../dtos/create-user-appointment-dto');
const { validateAppointmentCreation, ValidationError } = require('../utils/appointment-validations');

async function createGuestAppointment(data) {
  // Validar datos de entrada
  const { error, value } = createGuestAppointmentSchema.validate(data);
  if (error) {
    throw new ValidationError('Datos de entrada inválidos', 400);
  }

  // Verificar que el paciente invitado existe
  const guestPatient = await GuestPatient.findOne({
    where: { id: value.guest_patient_id, is_active: true }
  });
  if (!guestPatient) {
    throw new ValidationError('Paciente invitado no encontrado', 404);
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

  return {
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
  };
}

async function createUserAppointment(data, user) {
  const { error, value } = createUserAppointmentSchema.validate(data);
  if (error) {
    throw new ValidationError('Datos de entrada inválidos', 400);
  }
  const userId = user.id;
  const { disponibilidad, serviceType } = await validateAppointmentCreation(
    value.disponibilidad_id,
    value.service_type_id,
    value.preferred_date,
    value.preferred_time
  );
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
  return {
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
  };
}

async function getMyAppointments(user, query = {}) {
  const userId = user.id;
  const { status, page = 1, limit = 10 } = query;
  const whereClause = { user_id: userId };
  if (status) whereClause.status = status;
  const offset = (page - 1) * limit;
  const appointments = await Appointment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Disponibilidad,
        as: 'disponibilidad',
        include: [{ model: Especialidad, as: 'especialidad' }]
      },
      { model: ServiceType, as: 'serviceType' }
    ],
    order: [['preferred_date', 'ASC'], ['preferred_time', 'ASC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  return {
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
  };
}

// confirmAppointmentByEmail: implementar según tu lógica de confirmación por email

module.exports = {
  createGuestAppointment,
  createUserAppointment,
  getMyAppointments,
  // confirmAppointmentByEmail,
}; 