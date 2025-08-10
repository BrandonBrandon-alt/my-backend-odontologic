/**
 * Router de disponibilidades (availability).
 * Define rutas públicas para consulta y rutas protegidas (admin/dentista)
 * para creación, actualización y desactivación de disponibilidades.
 */
const express = require("express");
const router = express.Router(); // Instancia del router de Express
const availabilityController = require("../controllers/availability.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

/*
 * =================================================================
 * PUBLIC ROUTES
 * Rutas de libre acceso para consulta
 * =================================================================
 */

// @route   GET /api/availabilities
// @desc    Get all future availabilities
// @access  Public
router.get("/", availabilityController.getAll);

// @route   GET /api/availabilities/specialty/:specialtyId
// @desc    Get future availabilities by specialty
// @access  Public
router.get("/specialty/:specialtyId", availabilityController.getBySpecialty);

// @route   GET /api/availabilities/dentist/:dentistId
// @desc    Get future availabilities by dentist
// @access  Public
router.get("/dentist/:dentistId", availabilityController.getByDentist);

// @route   GET /api/availabilities/:id
// @desc    Get a single availability by its ID
// @access  Public
router.get("/:id", availabilityController.getById);

/*
 * =================================================================
 * PROTECTED ROUTES (Admin & Dentist)
 * Rutas que requieren autenticación y rol de admin o dentista
 * =================================================================
 */

// Aplica autenticación y autorización por rol a las rutas siguientes
router.use(authenticateToken);
router.use(authorizeRoles("admin", "dentist"));

// @route   POST /api/availabilities
// @desc    Create a new availability slot
// @access  Admin, Dentist
router.post("/", availabilityController.create);

// @route   PUT /api/availabilities/:id
// @desc    Update an existing availability slot
// @access  Admin, Dentist
router.put("/:id", availabilityController.update);

// @route   DELETE /api/availabilities/:id
// @desc    Deactivate (soft delete) an availability slot
// @access  Admin, Dentist
router.delete("/:id", availabilityController.deactivate);

module.exports = router;
