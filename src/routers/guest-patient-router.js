const express = require('express');
const router = express.Router();
const {
    createGuestPatient,
    getAllGuestPatients,
    getGuestPatientById,
    searchGuestPatients,
    updateGuestPatient,
    deactivateGuestPatient
} = require('../controllers/guest-patient-controller');
const { authenticateToken } = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.post('/', createGuestPatient);
router.get('/search', searchGuestPatients);

// Rutas protegidas (requieren autenticación)
router.get('/', authenticateToken, getAllGuestPatients);
router.get('/:id', authenticateToken, getGuestPatientById);
router.put('/:id', authenticateToken, updateGuestPatient);
router.delete('/:id', authenticateToken, deactivateGuestPatient);

module.exports = router; 