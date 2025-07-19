const express = require('express');
const router = express.Router();
const serviceTypeController = require('../controllers/service-type-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

/**
 * Public routes (no authentication)
 */
router.get('/', serviceTypeController.getAll); // GET /api/service-type
router.get('/specialty/:especialidad_id', serviceTypeController.getByEspecialidad); // GET /api/service-type/specialty/:especialidad_id
router.get('/:id', serviceTypeController.getById); // GET /api/service-type/:id

/**
 * Protected routes (admin only)
 */
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.post('/', serviceTypeController.create); // POST /api/service-type
router.put('/:id', serviceTypeController.update); // PUT /api/service-type/:id
router.delete('/:id', serviceTypeController.deactivate); // DELETE /api/service-type/:id

module.exports = router; 