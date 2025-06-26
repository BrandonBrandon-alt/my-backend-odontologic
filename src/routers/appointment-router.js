const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment-controller');
const { authenticateToken } = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.post('/guest', appointmentController.createGuestAppointment);

// Ruta para confirmar cita mediante email (pública)
router.get('/confirm/:id', appointmentController.confirmAppointmentByEmail);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Crear cita como usuario registrado
router.post('/user', appointmentController.createUserAppointment);

// Obtener citas del usuario autenticado
router.get('/user', appointmentController.getUserAppointments);

// Obtener estadísticas de citas
router.get('/stats', appointmentController.getAppointmentStats);

// Obtener todas las citas (para administradores)
router.get('/', appointmentController.getAllAppointments);

// Obtener una cita específica
router.get('/:id', appointmentController.getById);

// Actualizar estado de una cita
router.patch('/:id/status', appointmentController.updateStatus);

module.exports = router; 