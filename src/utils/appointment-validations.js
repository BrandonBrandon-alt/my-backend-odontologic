const { Disponibilidad, ServiceType, Especialidad, Appointment } = require('../models');

/**
 * Error personalizado con código HTTP
 */
class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

/**
 * Valida que una disponibilidad existe y está activa
 */
async function validateDisponibilidad(disponibilidadId) {
  const disponibilidad = await Disponibilidad.findOne({
    where: { id: disponibilidadId, is_active: true },
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        where: { is_active: true }
      }
    ]
  });

  if (!disponibilidad) {
    throw new ValidationError('Disponibilidad no encontrada o inactiva', 404);
  }

  return disponibilidad;
}

/**
 * Valida que un tipo de servicio existe y está activo
 */
async function validateServiceType(serviceTypeId) {
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, is_active: true },
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        where: { is_active: true }
      }
    ]
  });

  if (!serviceType) {
    throw new ValidationError('Tipo de servicio no encontrado o inactivo', 404);
  }

  return serviceType;
}

/**
 * Valida que el tipo de servicio corresponde a la especialidad de la disponibilidad
 */
function validateServiceTypeAndDisponibilidadCompatibility(serviceType, disponibilidad) {
  if (serviceType.especialidad_id !== disponibilidad.especialidad_id) {
    throw new ValidationError('El tipo de servicio no corresponde a la especialidad de la disponibilidad', 400);
  }
}

/**
 * Valida que la fecha y hora de la cita están dentro del rango de disponibilidad
 */
function validateAppointmentDateTime(preferredDate, preferredTime, disponibilidad) {
  const appointmentDate = new Date(preferredDate);
  const disponibilidadDate = new Date(disponibilidad.date);

  if (appointmentDate.getTime() !== disponibilidadDate.getTime()) {
    throw new ValidationError('La fecha de la cita debe coincidir con la fecha de disponibilidad', 400);
  }

  if (preferredTime < disponibilidad.start_time || preferredTime > disponibilidad.end_time) {
    throw new ValidationError('La hora de la cita debe estar dentro del rango de disponibilidad', 400);
  }
}

/**
 * Valida que no hay otra cita en el mismo horario
 */
async function validateNoConflictingAppointment(disponibilidadId, preferredTime) {
  const existingAppointment = await Appointment.findOne({
    where: {
      disponibilidad_id: disponibilidadId,
      preferred_time: preferredTime,
      status: ['pending', 'confirmed']
    }
  });

  if (existingAppointment) {
    throw new ValidationError('Ya existe una cita en este horario', 409);
  }
}

/**
 * Valida todos los aspectos de una cita antes de crearla
 */
async function validateAppointmentCreation(disponibilidadId, serviceTypeId, preferredDate, preferredTime) {
  // Validar disponibilidad
  const disponibilidad = await validateDisponibilidad(disponibilidadId);
  
  // Validar tipo de servicio
  const serviceType = await validateServiceType(serviceTypeId);
  
  // Validar compatibilidad
  validateServiceTypeAndDisponibilidadCompatibility(serviceType, disponibilidad);
  
  // Validar fecha y hora
  validateAppointmentDateTime(preferredDate, preferredTime, disponibilidad);
  
  // Validar conflicto de horarios
  await validateNoConflictingAppointment(disponibilidadId, preferredTime);
  
  return { disponibilidad, serviceType };
}

module.exports = {
  ValidationError,
  validateDisponibilidad,
  validateServiceType,
  validateServiceTypeAndDisponibilidadCompatibility,
  validateAppointmentDateTime,
  validateNoConflictingAppointment,
  validateAppointmentCreation
}; 