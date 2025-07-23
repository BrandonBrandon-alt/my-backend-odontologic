const { ContactMessage } = require("../models");
const createContactMessageDto = require("../dtos/contact/create-contact-message.dto");
const {
  sendConfirmationEmail,
  sendNotificationEmail,
} = require("../utils/mailer");

/**
 * Creates a standard error object with a status code.
 * @param {number} status - The HTTP status code.
 * @param {string} message - The error message.
 * @returns {Error} A new error object with a status property.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Validates contact data, saves it to the database, and triggers emails.
 * @param {object} messageData - The data from the contact form.
 * @param {object} meta - Metadata about the request (e.g., ip, userAgent).
 * @returns {Promise<{id: string, timestamp: Date, status: string}>} Key details of the created message.
 * @throws {Error} Throws a 400 validation error if data is invalid.
 */
async function sendContactMessage(messageData, meta) {
  // 1. Validate input data using the DTO
  const { error, value } = createContactMessageDto.validate(messageData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  // 2. Create the message in the database
  const contactMessage = await ContactMessage.create({
    ...value, // Use the validated and cleaned data from Joi
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  // 3. Send emails asynchronously (fire and forget)
  // This ensures the user gets a fast response even if email sending is slow or fails.
  sendConfirmationEmail(value.email, value.name).catch((err) => {
    console.error("Failed to send confirmation email:", err);
  });
  sendNotificationEmail(contactMessage).catch((err) => {
    console.error("Failed to send notification email:", err);
  });

  // 4. Return a clean success response to the client
  return {
    id: contactMessage.id,
    timestamp: contactMessage.createdAt,
    status: contactMessage.status,
  };
}

module.exports = { sendContactMessage };
