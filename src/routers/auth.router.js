const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// Assuming you have a recaptcha middleware
// const recaptchaMiddleware = require('../middleware/recaptcha.middleware');

/*
* =================================================================
* ACCOUNT REGISTRATION & LOGIN
* =================================================================
*/

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", /* recaptchaMiddleware, */ authController.register);

// @route   POST /api/auth/login
// @desc    Log in a user
// @access  Public
router.post("/login", /* recaptchaMiddleware, */ authController.login);


/*
* =================================================================
* ACCOUNT ACTIVATION
* =================================================================
*/

// @route   POST /api/auth/activate
// @desc    Activate a user account with a code
// @access  Public
router.post("/activate", authController.activateAccount);

// @route   POST /api/auth/resend-activation
// @desc    Resend the activation code
// @access  Public
router.post("/resend-activation", authController.resendActivationCode);


/*
* =================================================================
* PASSWORD RECOVERY
* =================================================================
*/

// @route   POST /api/auth/password/request-reset
// @desc    Request a password reset code
// @access  Public
router.post("/password/request-reset", authController.requestPasswordReset);

// @route   POST /api/auth/password/verify-code
// @desc    Verify a password reset code
// @access  Public
router.post("/password/verify-code", authController.verifyResetCode);

// @route   POST /api/auth/password/reset
// @desc    Reset the password with a valid code
// @access  Public
router.post("/password/reset", authController.resetPassword);


/*
* =================================================================
* SESSION MANAGEMENT (TOKENS)
* =================================================================
*/

// @route   POST /api/auth/token/refresh
// @desc    Get a new access token using a refresh token
// @access  Public
router.post("/token/refresh", authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Log out by invalidating the refresh token
// @access  Public
router.post("/logout", authController.logout);


module.exports = router;
