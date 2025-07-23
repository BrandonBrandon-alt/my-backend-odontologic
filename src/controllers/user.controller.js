const userService = require("../services/user.service");

// A helper to wrap async functions for cleaner error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Gets the profile of the currently authenticated user.
 * The user ID is extracted from the request object (set by auth middleware).
 */
const getProfile = asyncHandler(async (req, res, next) => {
  // Assumes an authentication middleware has added the user object to req
  const user = await userService.getProfile(req.user.id);
  res.status(200).json(user);
});

/**
 * Handles the request to change the authenticated user's password.
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const result = await userService.changePassword(req.user.id, req.body);
  res.status(200).json(result);
});

/**
 * Handles the request to update the authenticated user's profile information.
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const result = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json(result);
});

module.exports = {
  getProfile,
  changePassword,
  updateProfile,
};
