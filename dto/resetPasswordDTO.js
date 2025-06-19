const Joi = require('joi');

const resetPassword = Joi.object({
   password_reset_code: Joi.string().required().messages({
    'string.empty': 'El código de restablecimiento de contraseña es obligatorio',
    'any.required': 'El código de restablecimiento de contraseña es obligatorio',
    }),
  newPassword: Joi.string().min(6).max(20).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
});

module.exports = resetPassword;