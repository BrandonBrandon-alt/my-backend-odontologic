const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

// Joi schema to validate the data for changing a password.
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required.",
    "any.required": "Current password is required.",
  }),

  newPassword: passwordComplexity(complexityOptions).required().messages({
    "any.required": "Password is required.",
  }),
});

module.exports = changePasswordSchema;
