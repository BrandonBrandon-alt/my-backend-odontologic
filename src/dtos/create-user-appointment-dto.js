const Joi = require('joi');

const createUserAppointmentSchema = Joi.object({
  patient_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del paciente debe ser un número',
      'number.integer': 'El ID del paciente debe ser un número entero',
      'number.positive': 'El ID del paciente debe ser positivo',
      'any.required': 'El ID del paciente es requerido'
    }),
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
  preferred_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'La fecha debe estar en formato YYYY-MM-DD',
      'any.required': 'La fecha preferida es requerida'
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