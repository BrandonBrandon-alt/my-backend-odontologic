// src/middleware/recaptcha.middleware.js
/**
 * Middleware de verificación reCAPTCHA v3.
 * - Extrae el token `recaptchaToken` del cuerpo de la petición.
 * - Verifica el token contra la API de Google mediante el servicio.
 * - Aplica un umbral de score (0.5) recomendado por Google.
 */
const recaptchaService = require("../services/recaptcha.service");

const recaptchaMiddleware = async (req, res, next) => {
  // El frontend envía el token como "recaptchaToken"
  const { recaptchaToken } = req.body;

  // Permitir desactivar reCAPTCHA en entornos de desarrollo / pruebas controladas
  const bypass =
    process.env.DISABLE_RECAPTCHA === "true" ||
    process.env.NODE_ENV === "development";

  if (!recaptchaToken) {
    if (bypass) {
      console.warn("[reCAPTCHA] Bypass activo: petición sin token permitida.");
      return next();
    }
    return res.status(400).json({
      message: "El token de reCAPTCHA es requerido.",
    });
  }

  try {
    // Llama al nuevo servicio de reCAPTCHA
    const recaptchaResult = await recaptchaService.verify(
      recaptchaToken,
      req.socket.remoteAddress
    );

    // Google recomienda un umbral de 0.5
    if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
      console.warn(`reCAPTCHA check failed. Score: ${recaptchaResult.score}`);
      return res.status(403).json({
        message: "Verificación de reCAPTCHA fallida o actividad sospechosa.",
      });
    }

    // Si la verificación es exitosa, continúa con el siguiente middleware
    next();
  } catch (error) {
    // Pasa el error al manejador de errores de Express
    next(error);
  }
};

module.exports = recaptchaMiddleware;
