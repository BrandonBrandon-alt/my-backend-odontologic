const express = require('express');
const router = express.Router();
const disponibilidadController = require('../controllers/disponibilidad-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

/**
 * Public routes (no authentication)
 */
router.get('/', disponibilidadController.getAll); // GET /api/availability
router.get('/specialty/:specialty_id', disponibilidadController.getByEspecialidad); // GET /api/availability/specialty/:specialty_id
router.get('/dentist/:dentist_id', disponibilidadController.getByDentist); // GET /api/availability/dentist/:dentist_id
router.get('/:id', disponibilidadController.getById); // GET /api/availability/:id

/**
 * Protected routes (admin/dentist)
 */
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'dentist'));

router.post('/', disponibilidadController.create); // POST /api/availability
router.put('/:id', disponibilidadController.update); // PUT /api/availability/:id
router.delete('/:id', disponibilidadController.deactivate); // DELETE /api/availability/:id

module.exports = router; 