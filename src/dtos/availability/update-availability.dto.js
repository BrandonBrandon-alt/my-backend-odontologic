const Joi = require('joi');

// Joi schema to validate the data for updating an availability slot.
// All fields are optional.
const updateAvailabilitySchema = Joi.object({
  dentist_id: Joi.number().integer().positive(),
  specialty_id: Joi.number().integer().positive(),
  date: Joi.date().iso(),
  start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM:SS format.'
    }),
  end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .messages({
      'string.pattern.base': 'End time must be in HH:MM:SS format.'
    })
})
.when(Joi.object({ start_time: Joi.exist(), end_time: Joi.exist() }).unknown(), {
  then: Joi.object({
    end_time: Joi.string().greater(Joi.ref('start_time'))
      .messages({ 'any.greater': 'End time must be after start time.' })
  })
});

module.exports = updateAvailabilitySchema;