const Joi = require('joi');
const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    'string.email': 'A valid email address is required.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required.'
  })
});
module.exports = loginSchema;
