const express = require("express");
const router = express.Router();
const specialtyController = require("../controllers/specialty.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

/*
 * =================================================================
 * PUBLIC ROUTES
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
 * =================================================================
 */

// Apply authentication and role authorization middleware to all subsequent routes
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
