/**
 * Router de especialidades (Specialty).
 * Define rutas públicas para consultar especialidades y rutas protegidas (solo admin)
 * para crear, actualizar y desactivar.
 */
const express = require("express");
const router = express.Router(); // Instancia del router de Express
const specialtyController = require("../controllers/specialty.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

/*
 * =================================================================
 * PUBLIC ROUTES
 * Rutas de libre acceso
 * =================================================================
 */

// @route   GET /api/specialties
// @desc    Get all active specialties
// @access  Public
router.get("/", specialtyController.getAll);

// @route   GET /api/specialties/:id
// @desc    Get a single specialty by its ID
// @access  Public
router.get("/:id", specialtyController.getById);

/*
 * =================================================================
 * PROTECTED ROUTES (Admin Only)
 * Rutas que requieren autenticación y rol admin
 * =================================================================
 */

// Aplica autenticación y autorización a las rutas siguientes (solo admin)
router.use(authenticateToken);
router.use(authorizeRoles("admin"));

// @route   POST /api/specialties
// @desc    Create a new specialty
// @access  Admin
router.post("/", specialtyController.create);

// @route   PUT /api/specialties/:id
// @desc    Update an existing specialty
// @access  Admin
router.put("/:id", specialtyController.update);

// @route   DELETE /api/specialties/:id
// @desc    Deactivate (soft delete) a specialty
// @access  Admin
router.delete("/:id", specialtyController.deactivate);

module.exports = router;
