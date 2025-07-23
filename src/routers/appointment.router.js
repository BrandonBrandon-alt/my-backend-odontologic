const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware"); // Assuming this is the correct path

/*
 * =================================================================
 * PUBLIC ROUTES
 * =================================================================
 */

// @route   POST /api/appointments/guest
// @desc    Create an appointment as a guest
// @access  Public
router.post("/guest", appointmentController.create);

/*
 * =================================================================
 * AUTHENTICATED USER ROUTES
 * =================================================================
 */

// Apply authentication middleware to all routes below this point
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
 * =================================================================
 */

// @route   PATCH /api/appointments/:id/status
// @desc    Update the status of any appointment
// @access  Admin
router.patch(
  "/:id/status",
  authorizeRoles("admin"),
  appointmentController.updateStatus
);

// Note: The following admin-specific routes require corresponding methods in the controller.
// They are commented out until those methods are created.

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
