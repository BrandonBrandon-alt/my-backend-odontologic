const contactService = require("../services/contact.service");

// A helper to wrap async functions for cleaner error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handles the submission of a new contact message.
 * It calls the service to validate, save, and send emails.
 */
const sendContactMessage = asyncHandler(async (req, res, next) => {
  // Pass the request body and metadata to the service
  const result = await contactService.sendContactMessage(req.body, {
    ip: req.ip,
    userAgent: req.get("User-Agent"), // A more reliable way to get the user agent
  });

  res.status(201).json({
    message: "Message sent successfully. We will contact you soon.",
    data: result,
  });
});

module.exports = { sendContactMessage };
