/**
 * DTO de creación de mensaje de contacto.
 * Valida nombre, email, teléfono (opcional), asunto controlado y mensaje.
 * Nota: Al final se referencia `contactSchema` pero el esquema definido se llama
 * `createContactMessageSchema`. Esto podría ser un error de referencia.
 */
// File: dtos/create-contact-message.dto.js

const Joi = require("joi");

// Joi schema to validate the data from a contact form submission,
// incorporating the detailed rules from the express-validator example.
const createContactMessageSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      "string.min": "Name must be at least 2 characters long.",
      "string.pattern.base": "Name can only contain letters and spaces.",
      "any.required": "Name is required.",
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required() // Basic email validation
    .messages({
      "string.email": "A valid email address is required.",
      "any.required": "Email is required.",
    }),

  phone: Joi.string()
    .max(20)
    .allow(null, "")
    .trim()
    .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
    .messages({
      "string.pattern.base": "Phone number contains invalid characters.",
    }),

  subject: Joi.string()
    .required()
    .valid("consulta", "cita", "emergencia", "presupuesto", "otro")
    .messages({
      "any.only": "The selected subject is not valid.",
      "any.required": "Subject is required.",
    }),

  message: Joi.string().min(10).max(1000).required().trim().messages({
    "string.min": "Message must be at least 10 characters long.",
    "string.max": "Message cannot exceed 1000 characters.",
    "any.required": "Message is required.",
  }),
});

const validateContactData = (data) => {
  return createContactMessageSchema.validate(data, { abortEarly: false });
};

module.exports = createContactMessageSchema;
