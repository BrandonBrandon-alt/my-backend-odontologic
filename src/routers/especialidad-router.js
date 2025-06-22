const express = require('express');
const router = express.Router();
const especialidadController = require('../controllers/especialidad-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.get('/', especialidadController.getAll);
router.get('/:id', especialidadController.getById);

// Rutas protegidas (requieren autenticación y rol admin)
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.post('/', especialidadController.create);
router.put('/:id', especialidadController.update);
router.delete('/:id', especialidadController.deactivate);

module.exports = router; 