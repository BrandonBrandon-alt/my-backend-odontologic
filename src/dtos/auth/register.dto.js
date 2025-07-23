// File: dtos/auth/register.dto.js
const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

// Define password complexity rules to be reused.
const complexityOptions = {
  min: 8,
  max: 30,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4, // Must meet at least 4 of the requirements
};

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim().messages({
    'string.min': 'Name must be at least 2 characters long.',
    'any.required': 'Name is required.'
  }),
  idNumber: Joi.string().min(5).max(20).required().trim().messages({
    'any.required': 'ID number is required.'
  }),
  email: Joi.string().email().required().lowercase().messages({
    'string.email': 'A valid email address is required.',
    'any.required': 'Email is required.'
  }),
  password: passwordComplexity(complexityOptions).required().messages({
    'any.required': 'Password is required.'
  }),
  phone: Joi.string().min(7).max(20).required().trim().messages({
    'any.required': 'Phone number is required.'
  }),
  address: Joi.string().max(255).allow(null, '').trim(),
  birth_date: Joi.date().iso().max('now').allow(null).messages({
    'date.max': 'Birth date cannot be in the future.'
  }),
  recaptchaToken: Joi.string().required().messages({
    'any.required': 'reCAPTCHA verification is required.'
  })
});
module.exports = registerSchema;