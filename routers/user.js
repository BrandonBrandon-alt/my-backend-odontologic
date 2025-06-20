const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// ======================= RUTAS DE USUARIO =======================
router.get('/perfil', authenticateToken, userController.getProfile);
router.post('/cambiar-password', authenticateToken, userController.changePassword);
router.patch('/perfil', authenticateToken, userController.updateProfile);

module.exports = router;