const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

// Reuse the same complexity options for consistency.
const complexityOptionsForReset = {
  min: 8,
  max: 30,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
};

const resetPasswordSchema = Joi.object({
  resetCode: Joi.string().length(8).required().messages({
    'string.length': 'Reset code must be 8 characters long.',
    'any.required': 'Reset code is required.'
  }),
  newPassword: passwordComplexity(complexityOptionsForReset).required().messages({
    'any.required': 'New password is required.'
  })
});
module.exports = resetPasswordSchema;
