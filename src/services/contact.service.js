/**
 * Servicio de contacto.
 * Gestiona el almacenamiento de mensajes de contacto y el envío de correos de confirmación/notificación.
 */
const { ContactMessage } = require("../models");
const createContactMessageDto = require("../dtos/contact/create-contact-message.dto");
const {
  sendConfirmationEmail,
  sendNotificationEmail,
} = require("../utils/mailer");

/**
 * Crea un error HTTP estándar con código de estado.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje del error.
 * @returns {Error} Error con propiedad `status`.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Valida los datos de contacto, los guarda en base de datos y dispara correos electrónicos.
 * Pasos:
 * 1) Validar los datos de entrada con el DTO.
 * 2) Guardar el mensaje en la base de datos junto con metadatos (IP y user-agent).
 * 3) Enviar correos de confirmación al usuario y de notificación al equipo (asincrónicamente).
 * 4) Devolver una respuesta simplificada para el cliente.
 * @param {object} messageData - Datos del formulario de contacto.
 * @param {object} meta - Metadatos de la petición (p. ej., ip, userAgent).
 * @returns {Promise<{id: string, timestamp: Date, status: string}>} Datos clave del mensaje creado.
 * @throws {Error} 400 si la validación falla.
 */
async function sendContactMessage(messageData, meta) {
  // 1. Validar entrada con el DTO de Joi
  const { error, value } = createContactMessageDto.validate(messageData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  // 2. Crear el registro del mensaje en BD, agregando IP y user-agent
  const contactMessage = await ContactMessage.create({
    ...value, // Datos validados y saneados
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  // 3. Enviar correos en segundo plano (fire-and-forget) para no bloquear la respuesta
  // Correo de confirmación al usuario
  sendConfirmationEmail(value.email, value.name).catch((err) => {
    console.error("Failed to send confirmation email:", err);
  });
  // Correo de notificación al equipo con el contenido del mensaje
  sendNotificationEmail(contactMessage).catch((err) => {
    console.error("Failed to send notification email:", err);
  });

  // 4. Responder al cliente con información mínima
  return {
    id: contactMessage.id,
    timestamp: contactMessage.createdAt,
    status: contactMessage.status,
  };
}

module.exports = { sendContactMessage };
