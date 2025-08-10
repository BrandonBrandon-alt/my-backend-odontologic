/**
 * DTO de creación de especialidad.
 * Valida nombre requerido (2-100) y descripción opcional.
 */
// File: dtos/create-specialty.dto.js

const Joi = require('joi');

// Joi schema to validate the data needed to create a new specialty.
const createSpecialtySchema = Joi.object({
  // 'name' is required, must be a string, at least 2 characters long,
  // and we trim whitespace from the beginning and end.
  name: Joi.string().min(2).max(100).required().trim()
    .messages({
      'string.min': 'Specialty name must be at least 2 characters long.',
      'string.max': 'Specialty name cannot exceed 100 characters.',
      'any.required': 'Specialty name is required.'
    }),

  // 'description' is optional, must be a string.
  description: Joi.string().allow(null, '') // Allow null or empty string
});

module.exports = createSpecialtySchema;
