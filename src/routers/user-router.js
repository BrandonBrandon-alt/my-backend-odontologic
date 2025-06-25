const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-middleware');
const userController = require('../controllers/user-controller');

// ======================= RUTAS DE USUARIO =======================
// Rutas en español
router.get('/perfil', authenticateToken, userController.getProfile);
router.post('/cambiar-password', authenticateToken, userController.changePassword);
router.patch('/perfil', authenticateToken, userController.updateProfile);

// Rutas en inglés para compatibilidad con el frontend
router.get('/profile', authenticateToken, userController.getProfile);
router.post('/change-password', authenticateToken, userController.changePassword);
router.patch('/profile', authenticateToken, userController.updateProfile);

module.exports = router;