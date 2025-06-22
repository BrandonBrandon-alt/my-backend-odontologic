const Joi = require('joi');

const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .required()
    .messages({
      'any.only': 'El estado debe ser: pending, confirmed, cancelled o completed',
      'any.required': 'El estado es requerido'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Las notas no pueden exceder 500 caracteres'
    })
});

module.exports = updateAppointmentStatusSchema; 