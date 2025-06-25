const Joi = require('joi');

const createUserAppointmentSchema = Joi.object({
  disponibilidad_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de disponibilidad debe ser un número',
      'number.integer': 'El ID de disponibilidad debe ser un número entero',
      'number.positive': 'El ID de disponibilidad debe ser positivo',
      'any.required': 'El ID de disponibilidad es requerido'
    }),
  service_type_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del tipo de servicio debe ser un número',
      'number.integer': 'El ID del tipo de servicio debe ser un número entero',
      'number.positive': 'El ID del tipo de servicio debe ser positivo',
      'any.required': 'El ID del tipo de servicio es requerido'
    }),
  preferred_date: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'La fecha preferida debe ser una fecha válida',
      'date.format': 'La fecha debe estar en formato ISO (YYYY-MM-DD)',
      'date.min': 'La fecha no puede ser anterior a hoy',
      'any.required': 'La fecha preferida es requerida'
    }),
  preferred_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'La hora debe estar en formato HH:MM',
      'any.required': 'La hora preferida es requerida'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Las notas no pueden exceder 500 caracteres'
    })
});

module.exports = createUserAppointmentSchema; 