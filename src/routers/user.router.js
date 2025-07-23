const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

/*
 * =================================================================
 * USER PROFILE ROUTES
 * All routes in this file require authentication.
 * =================================================================
 */

// Apply authentication middleware to all routes in this file
router.use(authenticateToken);

// @route   GET /api/users/profile
// @desc    Get the profile of the currently authenticated user
// @access  Private
router.get("/profile", userController.getProfile);

// @route   PATCH /api/users/profile
// @desc    Update the profile of the currently authenticated user
// @access  Private
router.patch("/profile", userController.updateProfile);

// @route   POST /api/users/password/change
// @desc    Change the password for the currently authenticated user
// @access  Private
router.post("/password/change", userController.changePassword);

module.exports = router;
