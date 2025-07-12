const { ContactMessage } = require('../models');
const { sendConfirmationEmail, sendNotificationEmail } = require('../utils/mailer');

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Crear el mensaje en la base de datos
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Enviar emails (asíncrono para no bloquear la respuesta)
    Promise.all([
      sendConfirmationEmail(email, name),
      sendNotificationEmail(contactMessage)
    ]).catch(error => {
      console.error('Error enviando emails:', error);
      // No fallar la respuesta si los emails fallan
    });
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente. Te contactaremos pronto.',
      data: {
        id: contactMessage.id,
        timestamp: contactMessage.createdAt,
        status: contactMessage.status
      }
    });
    
  } catch (error) {
    console.error('Error en contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Inténtalo de nuevo más tarde.'
    });
  }
};

module.exports = { sendContactMessage }; 