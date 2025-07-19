// routers/auth.js

const express = require("express");
const router = express.Router();

const authController = require('../controllers/auth-controller');
const recaptchaMiddleware = require('../middleware/recaptcha-middleware');

// ======================= RUTAS =======================
router.post("/registro", recaptchaMiddleware, authController.registro);
router.post("/login", recaptchaMiddleware, authController.login);

router.post("/activar", authController.activar);
router.post("/reenviar-activacion", authController.resendActivationCode);
router.post("/solicitar-reset", authController.requestPasswordReset);
router.post("/reenviar-reset", authController.resendPasswordReset);
router.post("/cambiar-password-reset", authController.resetPassword);
router.post("/verificar-reset", authController.verifyResetCode);
router.post("/logout", authController.logout);
router.post("/token", authController.refreshToken);

// ======================= EXPORTACIONES =======================
module.exports = router;

