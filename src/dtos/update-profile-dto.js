// backend/validations/userValidation.js (o donde tengas este esquema)
const Joi = require("joi");

const updateProfileJoiSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({ // <-- Añadido .optional()
    "string.empty": "El nombre no puede estar vacío",
    "string.min": "El nombre debe tener al menos 2 caracteres",
    "string.max": "El nombre no puede exceder los 50 caracteres",
  }),
  email: Joi.string().email().optional().messages({ // <-- Añadido .optional()
    "string.email": "Debe ser un correo válido",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional() // <-- Añadido .optional()
    .messages({
      "string.pattern.base": "El teléfono debe tener 10 dígitos",
    }),
  address: Joi.string().max(255).optional().messages({ // <-- ¡Añade esta línea!
    "string.max": "La dirección no puede exceder los 255 caracteres",
  }),
  // No incluyas password aquí, mejor tener un endpoint específico para cambiar contraseña
})
.unknown(false); // <-- ¡Añade esto para solo permitir los campos definidos!

module.exports = updateProfileJoiSchema;