/**
 * Servicio de usuarios.
 * Incluye operaciones para obtener el perfil, cambiar la contraseña y actualizar el perfil.
 */
const { User } = require("../models/index");
const changePasswordDto = require("../dtos/user/change-password.dto");
const updateProfileDto = require("../dtos/user/update-profile.dto");
const bcrypt = require("bcrypt");

/**
 * Crea un error HTTP estándar con código de estado.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje del error.
 * @returns {Error} Error con propiedad `status`.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Obtiene el perfil de un usuario por su ID.
 * - Excluye el campo `password` por seguridad.
 * @param {number} userId - ID del usuario a recuperar.
 * @returns {Promise<User>} Usuario sin contraseña.
 * @throws {Error} 404 si el usuario no existe.
 */
async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] }, // Evita exponer el hash de contraseña
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
}

/**
 * Cambia la contraseña de un usuario tras validar la actual.
 * Pasos:
 * - Valida entrada con DTO.
 * - Verifica existencia de usuario.
 * - Compara contraseña actual.
 * - Evita reutilizar la contraseña actual como nueva.
 * - Hashea y guarda la nueva contraseña.
 * @param {number} userId - ID del usuario.
 * @param {object} body - Cuerpo de la petición con las contraseñas.
 * @param {string} body.currentPassword - Contraseña actual del usuario.
 * @param {string} body.newPassword - Nueva contraseña deseada.
 * @returns {Promise<{message: string}>}
 * @throws {Error} 400/401/404 según validaciones.
 */
async function changePassword(userId, body) {
  const { error } = changePasswordDto.validate(body); // Valida formato de entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const { currentPassword, newPassword } = body;
  const user = await User.findByPk(userId);
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password); // Verifica contraseña actual
  if (!isMatch) {
    throw createHttpError(401, "Incorrect current password");
  }

  const isNewSameAsCurrent = await bcrypt.compare(newPassword, user.password); // Evita reutilización
  if (isNewSameAsCurrent) {
    throw createHttpError(
      400,
      "New password cannot be the same as the current one"
    );
  }

  user.password = await bcrypt.hash(newPassword, 10); // Hashea nueva contraseña
  await user.save();

  return { message: "Password updated successfully." };
}

/**
 * Actualiza la información del perfil de un usuario.
 * - Valida los datos con DTO.
 * - Verifica existencia de usuario.
 * - Devuelve el usuario actualizado sin el campo `password`.
 * @param {number} userId - ID del usuario a actualizar.
 * @param {object} body - Datos nuevos para el perfil.
 * @returns {Promise<{user: object, message: string}>}
 * @throws {Error} 400/404 según validaciones.
 */
async function updateProfile(userId, body) {
  const { error, value: validatedData } = updateProfileDto.validate(body); // Valida y sanea datos
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  await user.update(validatedData); // Persiste cambios en el perfil

  // Devuelve el usuario sin password
  const userWithoutPassword = user.get({ plain: true });
  delete userWithoutPassword.password;

  return {
    user: userWithoutPassword,
    message: "Profile updated successfully.",
  };
}

module.exports = {
  getProfile,
  changePassword,
  updateProfile,
};
