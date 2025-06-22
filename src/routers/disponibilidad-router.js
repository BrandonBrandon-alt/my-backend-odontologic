const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/disponibilidad-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.get('/', disponibilidadController.getAll);
router.get('/especialidad/:especialidad_id', disponibilidadController.getByEspecialidad);
router.get('/dentist/:dentist_id', disponibilidadController.getByDentist);
router.get('/:id', disponibilidadController.getById);

// Rutas protegidas (requieren autenticación y rol admin/dentist)
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'dentist'));

router.post('/', disponibilidadController.create);
router.put('/:id', disponibilidadController.update);
router.delete('/:id', disponibilidadController.deactivate);

module.exports = router; 