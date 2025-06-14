const Joi = require("joi");

const updateProfile = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    "string.empty": "El nombre no puede estar vacío",
  }),
  email: Joi.string().email().messages({
    "string.email": "Debe ser un correo válido",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "El teléfono debe tener 10 dígitos",
    }),
  // No incluyas password aquí, mejor tener un endpoint específico para cambiar contraseña
});

module.exports = updateProfile;