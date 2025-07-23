// File: dtos/update-profile.dto.js

const Joi = require('joi');

// Joi schema to validate the data for updating a user's profile.
// All fields are optional, as a user might only want to update one piece of information.
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters long.',
      'string.max': 'Name cannot exceed 100 characters.'
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/) // Validates that the phone number has exactly 10 digits.
    .trim()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits.'
    }),

  address: Joi.string()
    .max(255)
    .trim()
    .messages({
      'string.max': 'Address cannot exceed 255 characters.'
    }),
  
  birth_date: Joi.date()
    .iso() // Expects date in 'YYYY-MM-DD' format.
    .messages({
      'date.format': 'Birth date must be in YYYY-MM-DD format.'
    })
})
.unknown(false); // Disallow any fields not defined in this schema.

module.exports = updateProfileSchema;
