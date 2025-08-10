/**
 * Router de autenticación.
 * Define rutas para registro, login, activación de cuenta, restablecimiento de contraseña,
 * verificación de token y manejo de refresh/logout.
 */
// src/routers/auth.router.js

const express = require("express");
const router = express.Router(); // Instancia del router de Express
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// ✅ Importación correcta del middleware de reCAPTCHA
const recaptchaMiddleware = require("../middleware/recaptcha.middleware");

/*
 * =================================================================
 * AUTHENTICATION & REGISTRATION
 * =================================================================
 */

// ✅ Rutas usando el middleware correctamente (protegen contra bots/abuso)
router.post("/register", recaptchaMiddleware, authController.register);
router.post("/login", recaptchaMiddleware, authController.login);

// --- El resto de tus rutas no necesitan reCAPTCHA ---
router.post("/logout", authenticateToken, authController.logout); // Requiere usuario autenticado
router.post("/token/refresh", authController.refreshToken); // Emite nuevo access token
router.get("/verify", authenticateToken, authController.verifyToken); // Verifica sesión vigente

/*
 * =================================================================
 * ACCOUNT ACTIVATION & PASSWORD
 * =================================================================
 */
router.post("/activate", authController.activateAccount);
router.post("/resend-activation", authController.resendActivationCode);
router.post("/password/forgot-password", authController.requestPasswordReset);
router.post("/password/reset-password", authController.resetPassword);
router.post("/password/verify-code", authController.verifyResetCode);

module.exports = router;
