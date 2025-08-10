/**
 * DTO de creación de cita para invitado.
 * Valida datos personales del invitado y la información de la cita.
 */
// File: dtos/create-guest-appointment.dto.js

const Joi = require("joi");

// This schema now captures the guest's details directly.
const createGuestAppointmentSchema = Joi.object({
  // Guest Information (datos del invitado)
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().lowercase(),
  phone: Joi.string().min(7).max(20).required().trim(),

  // Appointment Information (datos de la cita)
  availability_id: Joi.number().integer().positive().required(),
  service_type_id: Joi.number().integer().positive().required(),
  notes: Joi.string().max(1000).allow(null, "").trim(),
});

module.exports = createGuestAppointmentSchema;
