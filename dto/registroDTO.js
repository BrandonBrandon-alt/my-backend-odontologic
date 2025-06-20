// DTO para la creación de usuario (Registro)
// Asegúrate de que este archivo sea usado por tu backend para validar los datos de entrada
const Joi = require('joi');

const createUser = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder los 50 caracteres',
      'any.required': 'El nombre es obligatorio',
    }),
  idNumber: Joi.string()
    .pattern(/^[0-9]{8,10}$/) // Patrón para 8 a 10 dígitos numéricos
    .required()
    .messages({
      'string.pattern.base': 'El número de identificación debe tener entre 8 y 10 dígitos numéricos',
      'string.empty': 'El número de identificación no puede estar vacío',
      'any.required': 'El número de identificación es obligatorio',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un correo electrónico válido',
      'string.empty': 'El correo electrónico no puede estar vacío',
      'any.required': 'El correo electrónico es obligatorio',
    }),
  password: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'string.max': 'La contraseña no puede exceder los 20 caracteres',
      'string.empty': 'La contraseña no puede estar vacía',
      'any.required': 'La contraseña es obligatoria',
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/) // Patrón para exactamente 10 dígitos numéricos
    .required()
    .messages({
      'string.pattern.base': 'El teléfono debe tener exactamente 10 dígitos numéricos',
      'string.empty': 'El teléfono no puede estar vacío',
      'any.required': 'El teléfono es obligatorio',
    }),
  // ¡Ahora obligatorios!
  address: Joi.string()
    .max(255)
    .required() // <--- CAMBIADO A REQUIRED
    .messages({
      'string.max': 'La dirección no puede exceder los 255 caracteres',
      'string.empty': 'La dirección no puede estar vacía', // Mensaje ajustado
      'any.required': 'La dirección es obligatoria', // <--- NUEVO
    }),
  birth_date: Joi.date()
    .iso()
    .required() // <--- CAMBIADO A REQUIRED
    .messages({
      'date.base': 'La fecha de nacimiento debe ser una fecha válida',
      'date.iso': 'La fecha de nacimiento debe estar en formato ISO (YYYY-MM-DD)',
      'any.required': 'La fecha de nacimiento es obligatoria', // <--- NUEVO
    }),
  captchaToken: Joi.string().optional(),
});

module.exports = createUser;
