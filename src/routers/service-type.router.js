const express = require("express");
const router = express.Router();
const serviceTypeController = require("../controllers/service-type.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

/*
 * =================================================================
 * PUBLIC ROUTES
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
 * =================================================================
 */

// Apply authentication and role authorization middleware to all subsequent routes
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
