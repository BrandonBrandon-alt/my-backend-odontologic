const jwt = require('jsonwebtoken');

/**
 * Creates a standard error object with a status code.
 * This should ideally be in a shared utility file.
 * @param {number} status - The HTTP status code.
 * @param {string} message - The error message.
 * @returns {Error} A new error object with a status property.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Express middleware to authenticate a user via a JWT token.
 * It verifies the token from the 'Authorization' header and attaches
 * the decoded user payload to `req.user`.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

    if (!token) {
      throw createHttpError(401, 'Authentication token is required.');
    }

    // Special case for testing environments
    if (process.env.NODE_ENV === 'test' && token === 'test-token') {
      req.user = { id: 1, role: 'test' }; // Mock user
      return next();
    }

    const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedUser; // Add payload to request object
    next();
  } catch (error) {
    // Catches errors from jwt.verify (e.g., expired, invalid)
    next(createHttpError(403, 'Invalid or expired token.'));
  }
};

/**
 * Express middleware factory to authorize users based on roles.
 * Must be used after `authenticateToken`.
 * @param {...string} allowedRoles - A list of roles that are allowed to access the route.
 * @returns {function} An Express middleware function.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user should have been set by the authenticateToken middleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(createHttpError(403, 'Access denied: You do not have permission to perform this action.'));
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
