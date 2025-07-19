const express = require('express');
const router = express.Router();
const especialidadController = require('../controllers/especialidad-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

/**
 * Public routes (no authentication)
 */
router.get('/', especialidadController.getAll); // GET /api/specialty
router.get('/:id', especialidadController.getById); // GET /api/specialty/:id

/**
 * Protected routes (admin only)
 */
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.post('/', especialidadController.create); // POST /api/specialty
router.put('/:id', especialidadController.update); // PUT /api/specialty/:id
router.delete('/:id', especialidadController.deactivate); // DELETE /api/specialty/:id

module.exports = router; 