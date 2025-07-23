const Joi = require('joi');

// Joi schema to validate the data for updating a service type.
// All fields are optional.
const updateServiceTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim()
    .messages({
      'string.min': 'Service type name must be at least 2 characters long.'
    }),

  description: Joi.string().allow(null, ''),

  duration: Joi.number().integer().min(15)
    .messages({
      'number.min': 'Duration must be at least 15 minutes.'
    }),
  
  specialty_id: Joi.number().integer()
});

module.exports = updateServiceTypeSchema;