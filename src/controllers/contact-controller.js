const contactService = require('../services/contact-service');

const sendContactMessage = async (req, res) => {
  try {
    const result = await contactService.sendContactMessage(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Inténtalo de nuevo más tarde.'
    });
  }
};

module.exports = { sendContactMessage }; 