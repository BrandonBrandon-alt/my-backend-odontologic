/**
 * Router de tipos de servicio (ServiceType).
 * Define rutas públicas para consulta y rutas protegidas exclusivas de admin
 * para crear, actualizar y desactivar tipos de servicio.
 */
const express = require("express");
const router = express.Router(); // Instancia del router de Express
const serviceTypeController = require("../controllers/service-type.controller");
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

// @route   GET /api/service-types
// @desc    Get all active service types
// @access  Public
router.get("/", serviceTypeController.getAll);

// @route   GET /api/service-types/specialty/:specialtyId
// @desc    Get active service types by specialty
// @access  Public
router.get("/specialty/:specialtyId", serviceTypeController.getBySpecialty);

// @route   GET /api/service-types/:id
// @desc    Get a single service type by its ID
// @access  Public
router.get("/:id", serviceTypeController.getById);

/*
 * =================================================================
 * PROTECTED ROUTES (Admin Only)
 * Rutas que requieren autenticación y rol admin
 * =================================================================
 */

// Aplica autenticación y autorización (solo admin) a las rutas siguientes
router.use(authenticateToken);
router.use(authorizeRoles("admin"));

// @route   POST /api/service-types
// @desc    Create a new service type
// @access  Admin
router.post("/", serviceTypeController.create);

// @route   PUT /api/service-types/:id
// @desc    Update an existing service type
// @access  Admin
router.put("/:id", serviceTypeController.update);

// @route   DELETE /api/service-types/:id
// @desc    Deactivate (soft delete) a service type
// @access  Admin
router.delete("/:id", serviceTypeController.deactivate);

module.exports = router;
