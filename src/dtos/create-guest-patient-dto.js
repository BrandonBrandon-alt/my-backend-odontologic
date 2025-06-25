const Joi = require('joi');

const createGuestPatientSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'El teléfono debe tener un formato válido',
      'any.required': 'El teléfono es requerido'
    }),
  email: Joi.string()
    .email()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'El email debe tener un formato válido'
    })
});

module.exports = createGuestPatientSchema; 