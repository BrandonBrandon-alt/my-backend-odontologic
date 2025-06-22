const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment-controller');
const authMiddleware = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.post('/guest', appointmentController.createGuestAppointment);

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

// Crear cita como usuario registrado
router.post('/user', appointmentController.createUserAppointment);

// Obtener citas del usuario autenticado
router.get('/user', appointmentController.getUserAppointments);

// Obtener una cita específica
router.get('/:id', appointmentController.getById);

// Actualizar estado de una cita
router.patch('/:id/status', appointmentController.updateStatus);

module.exports = router; 