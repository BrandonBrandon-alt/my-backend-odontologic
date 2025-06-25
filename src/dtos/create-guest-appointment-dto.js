const Joi = require('joi');

const createGuestAppointmentSchema = Joi.object({
  // --- MEJORA: Se reemplaza guest_patient_id por los datos del paciente ---
  guest_patient: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.base': 'El nombre del paciente debe ser texto',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre del paciente es requerido'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Debe proporcionar un email válido',
      'any.required': 'El email del paciente es requerido'
    }),
    
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'El teléfono debe contener solo números y tener entre 10 y 15 dígitos',
      'any.required': 'El teléfono del paciente es requerido'
    })
  }).required(),
  
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
  preferred_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.base': 'La fecha preferida debe ser una cadena de texto',
      'string.pattern.base': 'La fecha debe estar en formato YYYY-MM-DD',
      'any.required': 'La fecha preferida es requerida'
    }),
  // preferred_time ya no es necesario, se toma de la disponibilidad
  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Las notas no pueden exceder 500 caracteres'
    })
});

module.exports = createGuestAppointmentSchema;
 