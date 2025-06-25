const express = require('express');
const router = express.Router();
const serviceTypeController = require('../controllers/service-type-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.get('/', serviceTypeController.getAll);
router.get('/especialidad/:especialidad_id', serviceTypeController.getByEspecialidad);
router.get('/:id', serviceTypeController.getById);

// Rutas protegidas (requieren autenticación y rol admin)
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.post('/', serviceTypeController.create);
router.put('/:id', serviceTypeController.update);
router.delete('/:id', serviceTypeController.deactivate);

module.exports = router; 