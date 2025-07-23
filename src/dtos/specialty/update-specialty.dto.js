const Joi = require('joi');

// Joi schema to validate the data for updating a specialty.
// All fields are optional, as the user might only want to update one.
const updateSpecialtySchema = Joi.object({
  // 'name' is optional for updates. If provided, it must follow the same rules.
  name: Joi.string().min(2).max(100).trim()
    .messages({
      'string.min': 'Specialty name must be at least 2 characters long.',
      'string.max': 'Specialty name cannot exceed 100 characters.'
    }),

  // 'description' is also optional.
  description: Joi.string().allow(null, '')
});

module.exports = updateSpecialtySchema;