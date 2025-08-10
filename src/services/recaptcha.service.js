// src/services/recaptcha.service.js
const axios = require('axios');

/**
 * Creates a standard error object with a status code.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Verifies a reCAPTCHA v3 token with Google's API.
 * @param {string} token - The reCAPTCHA token from the client.
 * @param {string} ip - The client's IP address.
 * @returns {Promise<object>} The verification result from Google.
 */
async function verify(token, ip) {
  const secretKey = process.env.RECAPTCHA_V3_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_V3_SECRET_KEY is not set.");
    throw createHttpError(500, "reCAPTCHA configuration error.");
  }

  const verificationURL = `https://www.google.com/recaptcha/api/siteverify`;

  try {
    const response = await axios.post(verificationURL, null, {
      params: {
        secret: secretKey,
        response: token,
        remoteip: ip,
      },
    });

    return response.data; // e.g., { success: true, score: 0.9, action: 'login' }
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error.message);
    throw createHttpError(500, "Failed to communicate with reCAPTCHA service.");
  }
}

module.exports = {
  verify,
};