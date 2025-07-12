const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contact-controller');
const { contactValidation, handleValidationErrors } = require('../middleware/contact-validation');
const contactRateLimiter = require('../middleware/contact-rate-limiter');

// POST /api/contact/send-message
router.post('/send-message', 
  contactRateLimiter,
  contactValidation,
  handleValidationErrors,
  sendContactMessage
);

module.exports = router; 