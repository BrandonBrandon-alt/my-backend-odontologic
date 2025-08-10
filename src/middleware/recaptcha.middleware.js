// src/middleware/recaptcha.middleware.js
const recaptchaService = require("../services/recaptcha.service");

const recaptchaMiddleware = async (req, res, next) => {
  // El frontend envía el token como "recaptchaToken"
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
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
