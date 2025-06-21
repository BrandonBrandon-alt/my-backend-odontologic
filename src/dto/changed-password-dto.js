// En tu archivo de esquemas Joi (ej. validationSchemas.js o dentro de tu ruta si lo prefieres así)
const Joi = require('joi');

// Esquema para el cambio de contraseña (requiere la contraseña actual)
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
      'string.min': 'La contraseña actual debe tener al menos 6 caracteres.',
      'string.max': 'La contraseña actual no puede exceder los 20 caracteres.',
      'any.required': 'La contraseña actual es obligatoria.',
      'string.empty': 'La contraseña actual no puede estar vacía.',
    }),
  newPassword: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
      'string.min': 'La nueva contraseña debe tener al menos 6 caracteres.',
      'string.max': 'La nueva contraseña no puede exceder los 20 caracteres.',
      'any.required': 'La nueva contraseña es obligatoria.',
      'string.empty': 'La nueva contraseña no puede estar vacía.',
    }),
});

module.exports = changePasswordSchema;