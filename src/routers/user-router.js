const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const { authenticateToken } = require('../middleware/auth-middleware');

/**
 * User routes (all require authentication)
 */
router.get('/profile', authenticateToken, userController.getProfile); // GET /api/user/profile
router.post('/change-password', authenticateToken, userController.changePassword); // POST /api/user/change-password
router.patch('/profile', authenticateToken, userController.updateProfile); // PATCH /api/user/profile

module.exports = router;