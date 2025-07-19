const express = require('express');
const router = express.Router();
const guestPatientController = require('../controllers/guest-patient-controller');
const { authenticateToken } = require('../middleware/auth-middleware');

/**
 * Public routes (no authentication)
 */
router.post('/', guestPatientController.create); // POST /api/guest-patient

/**
 * Protected routes (authentication required)
 */
router.use(authenticateToken);

router.get('/:id', guestPatientController.getById); // GET /api/guest-patient/:id
router.put('/:id', guestPatientController.update); // PUT /api/guest-patient/:id
router.delete('/:id', guestPatientController.deactivate); // DELETE /api/guest-patient/:id

module.exports = router; 