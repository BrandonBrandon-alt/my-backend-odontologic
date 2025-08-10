/**
 * DTO de token de refresco/acceso.
 * Valida el formato básico de un JWT (header.payload.signature) mediante regex.
 */
const Joi = require('joi');
const tokenSchema = Joi.object({
  token: Joi.string()
    // This regex checks for the basic structure of a JWT (header.payload.signature)
    .pattern(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)
    .required()
    .messages({
      'string.pattern.base': 'Token has an invalid format.',
      'any.required': 'Token is required.'
    })
});
module.exports = tokenSchema;