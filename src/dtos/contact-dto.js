const Joi = require('joi');

const contactSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.empty': 'El nombre es requerido',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'string.pattern.base': 'El nombre solo puede contener letras y espacios',
      'any.required': 'El nombre es requerido'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.empty': 'El email es requerido',
      'string.email': 'El email no tiene un formato válido',
      'string.max': 'El email es demasiado largo',
      'any.required': 'El email es requerido'
    }),

  phone: Joi.string()
    .max(20)
    .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
    .optional()
    .allow('')
    .messages({
      'string.max': 'El teléfono es demasiado largo',
      'string.pattern.base': 'El teléfono no tiene un formato válido'
    }),

  subject: Joi.string()
    .valid('consulta', 'cita', 'emergencia', 'presupuesto', 'otro')
    .max(50)
    .required()
    .messages({
      'string.empty': 'El asunto es requerido',
      'any.only': 'El asunto seleccionado no es válido',
      'string.max': 'El asunto es demasiado largo',
      'any.required': 'El asunto es requerido'
    }),

  message: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'El mensaje es requerido',
      'string.min': 'El mensaje debe tener al menos 10 caracteres',
      'string.max': 'El mensaje no puede exceder 1000 caracteres',
      'any.required': 'El mensaje es requerido'
    })
});

const validateContactData = (data) => {
  return contactSchema.validate(data, { abortEarly: false });
};

module.exports = {
  contactSchema,
  validateContactData
}; 