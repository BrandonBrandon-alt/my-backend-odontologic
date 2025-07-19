const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment-controller');
const serverAppointmentController = require('../controllers/server-appointment-controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth-middleware');

// Rutas públicas (sin autenticación)
router.post('/guest', appointmentController.createGuestAppointment);
router.get('/confirm/:id', appointmentController.confirmAppointmentByEmail);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Crear cita como usuario autenticado
router.post('/patient', appointmentController.createUserAppointment);

// Obtener citas del usuario autenticado
router.get('/my', appointmentController.getMyAppointments);

// Rutas de administración (solo admin)
router.get('/stats', authorizeRoles('admin'), serverAppointmentController.getAppointmentStats);
router.get('/', authorizeRoles('admin'), serverAppointmentController.getAllAppointments);
router.get('/:id', authorizeRoles('admin'), serverAppointmentController.getById);
router.patch('/:id/status', authorizeRoles('admin'), serverAppointmentController.updateStatus);

module.exports = router; 