/**
 * Controlador de contacto.
 * Gestiona la recepción de mensajes de contacto y delega su procesamiento al servicio.
 */
const contactService = require("../services/contact.service");

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para controladores asíncronos que redirige errores al middleware de errores.
 * @param {Function} fn - Función asíncrona (req, res, next).
 * @returns {Function} Middleware Express con manejo de errores.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Maneja el envío de un nuevo mensaje de contacto.
 * Llama al servicio para validar, guardar y enviar correos.
 */
const sendContactMessage = asyncHandler(async (req, res, next) => {
  // Pasa el cuerpo de la solicitud y metadatos relevantes al servicio
  const result = await contactService.sendContactMessage(req.body, {
    ip: req.ip,
    userAgent: req.get("User-Agent"), // Forma fiable de obtener el user agent
  });

  res.status(201).json({
    message: "Message sent successfully. We will contact you soon.",
    data: result,
  });
});

module.exports = { sendContactMessage };
