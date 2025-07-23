const Joi = require('joi');

// Joi schema to validate the data for creating a new service type.
const createServiceTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim()
    .messages({
      'string.min': 'Service type name must be at least 2 characters long.',
      'any.required': 'Service type name is required.'
    }),

  description: Joi.string().allow(null, ''),

  duration: Joi.number().integer().min(15).required()
    .messages({
      'number.min': 'Duration must be at least 15 minutes.',
      'any.required': 'Duration is required.'
    }),

  specialty_id: Joi.number().integer().required()
    .messages({
      'any.required': 'Specialty is required.'
    })
});

module.exports = createServiceTypeSchema;