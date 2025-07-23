const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// Assuming you have a rate limiter middleware for this public endpoint
// const contactRateLimiter = require('../middleware/contact-rate-limiter.middleware');

/*
* =================================================================
* CONTACT ROUTES
* =================================================================
*/

// @route   POST /api/contact
// @desc    Submit a message from the contact form
// @access  Public
router.post(
  '/',
  // contactRateLimiter, // Apply rate limiting to prevent spam
  contactController.sendContactMessage
);

module.exports = router;
