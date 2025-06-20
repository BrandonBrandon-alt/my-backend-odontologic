// routers/auth.js

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// ======================= RUTAS =======================
router.post("/registro", authController.register);
router.post("/login", authController.login);
router.post("/token", authController.refreshToken);
router.post("/activar", authController.activateAccount);
router.post("/reenviar-activacion", authController.resendActivationCode);
router.post("/solicitar-reset", authController.requestPasswordReset);
router.post("/reenviar-reset", authController.resendPasswordReset);
router.post("/cambiar-password-reset", authController.resetPassword);
router.post("/verificar-reset", authController.verifyResetCode);
router.post("/logout", authController.logout);

// ======================= EXPORTACIONES =======================
if (process.env.NODE_ENV === 'test') {
    module.exports = {
        router: router,
        getRefreshTokens: authController.getRefreshTokens,
        clearRefreshTokens: authController.clearRefreshTokens,
    };
} else {
    module.exports = router;
}