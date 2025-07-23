const Joi = require('joi');

// Joi schema to validate the data for creating a new availability slot.
const createAvailabilitySchema = Joi.object({
  dentist_id: Joi.number().integer().positive().required(),
  specialty_id: Joi.number().integer().positive().required(),
  date: Joi.date().iso().greater('now').required() // Ensures the date is in the future
    .messages({
      'date.greater': 'Availability date must be in the future.'
    }),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).required() // HH:MM:SS format
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM:SS format.'
    }),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).required()
    .greater(Joi.ref('start_time')) // Ensures end_time is after start_time
    .messages({
      'string.pattern.base': 'End time must be in HH:MM:SS format.',
      'any.greater': 'End time must be after start time.'
    })
});

module.exports = createAvailabilitySchema;