/**
 * DTO de login.
 * Valida credenciales básicas: email y contraseña.
 */
const Joi = require("joi");
const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    "string.email": "A valid email address is required.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
  // Allow passing reCAPTCHA token (validated earlier by middleware); ignored by service
  recaptchaToken: Joi.string().optional(),
});
module.exports = loginSchema;
