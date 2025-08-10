/**
 * Utilidades de usuario.
 * Proporciona un helper para sanitizar un modelo de usuario de Sequelize
 * removiendo campos sensibles antes de responder en la API.
 */
// src/utils/user-utils.js

/**
 * Takes a Sequelize user instance and returns a safe object
 * for API responses, excluding sensitive fields.
 * @param {object} user - The Sequelize user model instance.
 * @returns {object | null} A plain object without sensitive data, or null.
 */
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  // Use .get({ plain: true }) to get a plain object from the Sequelize instance
  const plainUser = user.get({ plain: true });

  // Destructure to remove sensitive properties
  const {
    password,
    activation_code,
    activation_expires_at,
    password_reset_code,
    password_reset_expires_at,
    ...safeUser
  } = plainUser;

  return safeUser; // Devuelve el objeto sin campos sensibles
}

module.exports = {
  sanitizeUser,
};
