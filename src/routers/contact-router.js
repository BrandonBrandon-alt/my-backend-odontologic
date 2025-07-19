const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contact-controller');
const { contactValidation, handleValidationErrors } = require('../middleware/contact-validation');
const contactRateLimiter = require('../middleware/contact-rate-limiter');

/**
 * Rutas de contacto (públicas)
 */

// Enviar mensaje de contacto (con rate limit y validación)
router.post(
  '/message',
  contactRateLimiter,
  contactValidation,
  handleValidationErrors,
  sendContactMessage
);

module.exports = router; 