/**
 * DTO de creación de cita para usuario registrado.
 * No requiere el ID del usuario en el cuerpo, pues proviene de la sesión autenticada.
 */
const Joi = require("joi");

// For registered users, we don't need their ID in the body,
// as it will come from their authenticated session (e.g., JWT).
const createUserAppointmentSchema = Joi.object({
  availability_id: Joi.number().integer().positive().required(), // ID de disponibilidad
  service_type_id: Joi.number().integer().positive().required(), // ID de tipo de servicio
  notes: Joi.string().max(1000).allow(null, "").trim(),
});

module.exports = createUserAppointmentSchema;
