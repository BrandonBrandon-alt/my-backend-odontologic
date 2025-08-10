/**
 * Router de usuario.
 * Define rutas de perfil y contraseña. Todas requieren autenticación previa.
 */
const express = require("express");
const router = express.Router(); // Instancia del router de Express
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

/*
 * =================================================================
 * USER PROFILE ROUTES
 * All routes in this file require authentication.
 * Rutas de perfil de usuario (todas requieren autenticación)
 * =================================================================
 */

// Aplica middleware de autenticación a todas las rutas de este archivo
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
