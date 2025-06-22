const express = require('express');
const router = express.Router();
const guestPatientController = require('../controllers/guest-patient-controller');
const authMiddleware = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.post('/', guestPatientController.create);

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

router.get('/:id', guestPatientController.getById);
router.put('/:id', guestPatientController.update);
router.delete('/:id', guestPatientController.deactivate);

module.exports = router; 