const Joi = require('joi');

const createUser = Joi.object({
 name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre no puede estar vacío',
    'any.required': 'El nombre es obligatorio',
  }),
  idNumber: Joi.string().pattern(/^[0-9]{8,10}$/).required().messages({
    'string.pattern.base': 'El número de identificación debe tener entre 8 y 10 dígitos',
    'any.required': 'El número de identificación es obligatorio',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un correo válido',
    'any.required': 'El correo es obligatorio',
  }),
  password: Joi.string().min(6).max(20).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'El teléfono debe tener 10 dígitos',
    'any.required': 'El teléfono es obligatorio',
  }),
});

module.exports = createUser;