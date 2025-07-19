const { ContactMessage } = require('../models');
const { sendConfirmationEmail, sendNotificationEmail } = require('../utils/mailer');

async function sendContactMessage(data, meta) {
  const { name, email, phone, subject, message } = data;
  // Crear el mensaje en la base de datos
  const contactMessage = await ContactMessage.create({
    name,
    email,
    phone,
    subject,
    message,
    ipAddress: meta.ip,
    userAgent: meta.userAgent
  });
  // Enviar emails (asíncrono para no bloquear la respuesta)
  Promise.all([
    sendConfirmationEmail(email, name),
    sendNotificationEmail(contactMessage)
  ]).catch(error => {
    console.error('Error enviando emails:', error);
    // No fallar la respuesta si los emails fallan
  });
  return {
    success: true,
    message: 'Mensaje enviado correctamente. Te contactaremos pronto.',
    data: {
      id: contactMessage.id,
      timestamp: contactMessage.createdAt,
      status: contactMessage.status
    }
  };
}

module.exports = { sendContactMessage }; 