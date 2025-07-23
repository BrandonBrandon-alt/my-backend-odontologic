const Joi = require("joi");

// For registered users, we don't need their ID in the body,
// as it will come from their authenticated session (e.g., JWT).
const createUserAppointmentSchema = Joi.object({
  availability_id: Joi.number().integer().positive().required(),
  service_type_id: Joi.number().integer().positive().required(),
  notes: Joi.string().max(1000).allow(null, "").trim(),
});

module.exports = createUserAppointmentSchema;
