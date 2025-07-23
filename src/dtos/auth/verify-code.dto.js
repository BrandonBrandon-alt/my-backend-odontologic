const Joi = require('joi');
const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    'string.email': 'A valid email address is required.',
    'any.required': 'Email is required.'
  }),
  code: Joi.string().length(8).required().messages({
    'string.length': 'Code must be 8 characters long.',
    'any.required': 'Code is required.'
  })
});
module.exports = verifyCodeSchema;