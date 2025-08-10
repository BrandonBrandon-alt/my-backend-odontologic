/**
 * Controlador de usuario.
 * Expone endpoints para obtener el perfil, cambiar la contraseña y actualizar el perfil
 * del usuario autenticado, delegando la lógica al servicio de usuarios.
 */
const userService = require("../services/user.service");

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para controladores asíncronos que redirige errores a `next`.
 * @param {Function} fn - Controlador asíncrono.
 * @returns {Function} Middleware Express con manejo unificado de errores.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Obtiene el perfil del usuario autenticado.
 * El ID del usuario se extrae desde `req.user` (inyectado por el middleware de auth).
 */
const getProfile = asyncHandler(async (req, res, next) => {
  // Se asume que un middleware de autenticación añadió el objeto user a req
  const user = await userService.getProfile(req.user.id);
  res.status(200).json(user);
});

/**
 * Maneja la solicitud de cambio de contraseña del usuario autenticado.
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const result = await userService.changePassword(req.user.id, req.body);
  res.status(200).json(result);
});

/**
 * Maneja la actualización de la información del perfil del usuario autenticado.
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
