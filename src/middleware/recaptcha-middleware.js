const { verifyRecaptcha } = require('../controllers/auth-controller');

module.exports = async (req, res, next) => {
    const { captchaToken } = req.body;
    const recaptchaResult = await verifyRecaptcha(captchaToken);
    if (!recaptchaResult || !recaptchaResult.success || recaptchaResult.score < 0.5) {
        return res.status(403).json({ error: "Verificación de reCAPTCHA fallida o actividad sospechosa." });
    }
    next();
}; 