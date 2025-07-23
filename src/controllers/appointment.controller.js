const appointmentService = require("../services/appointment.service");

// A helper to wrap async functions for cleaner error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handles the creation of a new appointment.
 * It works for both guests and authenticated users, passing the `req.user`
 * object (or null if it's a guest) to the service layer.
 */
const create = asyncHandler(async (req, res, next) => {
  const result = await appointmentService.create(req.body, req.user);
  res.status(201).json(result);
});

/**
 * Retrieves all appointments for the currently authenticated user.
 * This route must be protected by authentication middleware.
 */
const getMyAppointments = asyncHandler(async (req, res, next) => {
  const result = await appointmentService.getMyAppointments(
    req.user,
    req.query
  );
  res.status(200).json(result);
});

/**
 * Updates the status of a specific appointment.
 * This route should be protected (e.g., for admin use).
 */
const updateStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await appointmentService.updateStatus(id, req.body);
  res.status(200).json(result);
});

module.exports = {
  create,
  getMyAppointments,
  updateStatus,
};
