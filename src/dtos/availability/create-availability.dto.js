const Joi = require("joi");

// Joi schema to validate the data for creating a new availability slot.
const createAvailabilitySchema = Joi.object({
  dentist_id: Joi.number().integer().positive().required(),
  specialty_id: Joi.number().integer().positive().required(),
  date: Joi.date().iso().greater("now").required().messages({
    "date.greater": "Availability date must be in the future.",
  }),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM:SS format.",
    }),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be in HH:MM:SS format.",
    }),
})
  // Add a custom validator for the whole object
  .custom((value, helpers) => {
    if (value.start_time >= value.end_time) {
      // If the end_time is not after start_time, return a custom error.
      return helpers.error("any.invalid", {
        message: "End time must be after start time",
      });
    }
    // Otherwise, return the validated value.
    return value;
  });

module.exports = createAvailabilitySchema;
