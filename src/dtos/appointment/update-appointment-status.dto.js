// File: dtos/update-appointment-status.dto.js

const Joi = require("joi");

// Joi schema to validate the data for updating an appointment's status.
const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "confirmed", "cancelled", "completed") // Must be one of these values
    .required()
    .messages({
      "any.only":
        "Status must be one of [pending, confirmed, cancelled, completed].",
      "any.required": "Status is required.",
    }),
});

module.exports = updateAppointmentStatusSchema;
