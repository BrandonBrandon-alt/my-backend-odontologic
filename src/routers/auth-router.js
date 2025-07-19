// routers/auth.js

const express = require("express");
const router = express.Router();

const authController = require('../controllers/auth-controller');
const recaptchaMiddleware = require('../middleware/recaptcha-middleware');

// ==== Register and login ====
router.post("/register", recaptchaMiddleware, authController.register);
router.post("/login", recaptchaMiddleware, authController.login);

// ==== Account activation ====
router.post("/active", authController.activate);
router.post("/resend-activation", authController.resendActivationCode);

// ==== Password recovery ====
router.post("/request-reset", authController.requestPasswordReset);
router.post("/resend-reset", authController.resendPasswordReset);
router.post("/change-password-reset", authController.resetPassword);
router.post("/verify-reset", authController.verifyResetCode);

// ==== Session and tokens ====
router.post("/logout", authController.logout);
router.post("/token", authController.refreshToken);

module.exports = router;

