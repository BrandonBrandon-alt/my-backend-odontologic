// File: dtos/auth/email.dto.js (Reusable for multiple actions)
const Joi = require('joi');
const emailSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    'string.email': 'A valid email address is required.',
    'any.required': 'Email is required.'
  })
});
module.exports = emailSchema;
2