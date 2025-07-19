const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');

/**
 * Rutas de administrador
 * (agregar protección con authenticateToken y authorizeRoles('admin') si es necesario)
 */

router.get('/dentists', adminController.listDentists);
router.get('/dentist/:id', adminController.getDentist);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);

module.exports = router;