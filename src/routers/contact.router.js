/**
 * Router de contacto.
 * Define la ruta pública para el envío de mensajes desde el formulario de contacto.
 */
const express = require('express');
const router = express.Router(); // Instancia del router de Express
const contactController = require('../controllers/contact.controller');

// Se asume un middleware de rate-limiting para este endpoint público
// const contactRateLimiter = require('../middleware/contact-rate-limiter.middleware');

/*
* =================================================================
* CONTACT ROUTES
* Rutas públicas de contacto
* =================================================================
*/

// @route   POST /api/contact
// @desc    Submit a message from the contact form
// @access  Public
router.post(
  '/',
  // contactRateLimiter, // Aplicar limitador de tasa para prevenir spam
  contactController.sendContactMessage
);

module.exports = router;
