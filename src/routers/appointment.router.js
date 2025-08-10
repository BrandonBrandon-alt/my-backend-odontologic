/**
 * Router de citas (appointments).
 * Define rutas públicas, privadas (usuario autenticado) y de administración
 * para crear citas, listar las propias y actualizar el estado.
 */
const express = require("express");
const router = express.Router(); // Instancia de router de Express
const appointmentController = require("../controllers/appointment.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware"); // Middlewares de autenticación y autorización

/*
 * =================================================================
 * PUBLIC ROUTES
 * Rutas accesibles sin autenticación
 * =================================================================
 */

// @route   POST /api/appointments/guest
// @desc    Create an appointment as a guest
// @access  Public
router.post("/guest", appointmentController.create);

/*
 * =================================================================
 * AUTHENTICATED USER ROUTES
 * Rutas que requieren autenticación (usuario logueado)
 * =================================================================
 */

// Aplica autenticación a todas las rutas siguientes
router.use(authenticateToken);

// @route   POST /api/appointments
// @desc    Create an appointment as a logged-in user
// @access  Private
router.post("/", appointmentController.create);

// @route   GET /api/appointments/my
// @desc    Get all appointments for the current user
// @access  Private
router.get("/my", appointmentController.getMyAppointments);

/*
 * =================================================================
 * ADMIN ROUTES
 * Rutas restringidas a administradores
 * =================================================================
 */

// @route   PATCH /api/appointments/:id/status
// @desc    Update the status of any appointment
// @access  Admin
router.patch(
  "/:id/status",
  authorizeRoles("admin"), // Verifica que el rol sea administrador
  appointmentController.updateStatus
);

// Nota: Las siguientes rutas de administrador requieren métodos correspondientes en el controlador.
// Se mantienen comentadas hasta que dichos métodos existan.

// @route   GET /api/appointments
// @desc    Get all appointments in the system
// @access  Admin
// router.get('/', authorizeRoles('admin'), appointmentController.getAllAppointments);

// @route   GET /api/appointments/stats
// @desc    Get appointment statistics
// @access  Admin
// router.get('/stats', authorizeRoles('admin'), appointmentController.getAppointmentStats);

// @route   GET /api/appointments/:id
// @desc    Get a single appointment by ID
// @access  Admin
// router.get('/:id', authorizeRoles('admin'), appointmentController.getById);

module.exports = router;
