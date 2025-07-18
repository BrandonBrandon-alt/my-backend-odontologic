const Joi = require('joi');

const login = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un correo válido',
    'any.required': 'El correo es obligatorio',
  }),
  password: Joi.string().min(6).max(20).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
  captchaToken: Joi.string().required().messages({
    'any.required': 'El captcha es obligatorio',
  }),
});

module.exports = login;