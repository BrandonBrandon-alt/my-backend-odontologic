// src/services/recaptcha.service.js
/**
 * Servicio de verificación reCAPTCHA v3.
 * Encapsula la comunicación con la API de Google para verificar el token enviado por el cliente.
 */
const axios = require('axios');

/**
 * Crea un error HTTP estándar con código de estado.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje descriptivo del error.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Verifica un token de reCAPTCHA v3 utilizando la API de Google.
 * - Requiere que la variable de entorno RECAPTCHA_V3_SECRET_KEY esté configurada.
 * - Envía una petición POST con el token y la IP del usuario.
 * @param {string} token - Token de reCAPTCHA enviado por el cliente.
 * @param {string} ip - Dirección IP del cliente.
 * @returns {Promise<object>} Resultado de verificación devuelto por Google.
 */
async function verify(token, ip) {
  const secretKey = process.env.RECAPTCHA_V3_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_V3_SECRET_KEY is not set.");
    throw createHttpError(500, "reCAPTCHA configuration error.");
  }

  const verificationURL = `https://www.google.com/recaptcha/api/siteverify`;

  try {
    // Se envía una solicitud POST sin cuerpo, pasando parámetros en la URL
    const response = await axios.post(verificationURL, null, {
      params: {
        secret: secretKey, // Clave secreta del servidor
        response: token,   // Token recibido del cliente
        remoteip: ip,      // IP del cliente (opcional pero recomendado)
      },
    });

    return response.data; // Devuelve { success, score, action, ... }
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error.message);
    throw createHttpError(500, "Failed to communicate with reCAPTCHA service.");
  }
}

module.exports = {
  verify,
};