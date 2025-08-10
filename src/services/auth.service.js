/**
 * Servicio de autenticación y gestión de cuentas de usuario.
 * Proporciona registro, login, refresco de tokens, logout, activación de cuenta,
 * reenvío de código de activación, solicitud y verificación de restablecimiento de contraseña,
 * restablecimiento de contraseña y verificación de sesión mediante token.
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, RefreshToken } = require("../models");
const {
  sendActivationEmail,
  sendPasswordResetEmail,
} = require("../utils/mailer");
const { sanitizeUser } = require("../utils/user.utils");

// DTO Imports (validaciones de entrada)
const registerDto = require("../dtos/auth/register.dto");
const loginDto = require("../dtos/auth/login.dto");
const resetPasswordDto = require("../dtos/auth/reset-password.dto");
const emailDto = require("../dtos/auth/email.dto");
const verifyCodeDto = require("../dtos/auth/verify-code.dto");
const tokenDto = require("../dtos/auth/token.dto");

/**
 * Crea un error estándar con código de estado HTTP.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje descriptivo del error.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Genera un código aleatorio y su fecha de expiración.
 * @param {number} [length=8] - Longitud del código.
 * @param {number} [expiresInMinutes=60] - Minutos hasta la expiración.
 * @returns {{code: string, expiresAt: Date}} Código y fecha de expiración.
 */
function generateCodeWithExpiration(length = 8, expiresInMinutes = 60) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Evita caracteres ambiguos como I, O, 0, 1
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length)); // Selecciona un carácter aleatorio
  }
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000); // Calcula la fecha de expiración
  return { code, expiresAt };
}

/**
 * Registra un nuevo usuario.
 * - Valida los datos de entrada.
 * - Verifica si ya existe un usuario por email o cédula.
 * - Hashea la contraseña, genera código de activación y envía email.
 * @param {object} data - Datos del registro.
 * @returns {Promise<object>} Usuario saneado (sin campos sensibles).
 */
async function register(data) {
  const { error, value } = registerDto.validate(data); // Valida la estructura del registro
  if (error) throw createHttpError(400, error.details[0].message);

  const { name, idNumber, email, password, phone, address, birth_date } = value;

  // Busca coincidencia por cédula o email para evitar duplicados
  const existingUser = await User.findOne({
    where: { [Op.or]: [{ id_number: idNumber }, { email }] },
  });
  if (existingUser) {
    throw createHttpError(
      409,
      "User already exists with this email or ID number."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Hashea la contraseña con salt 10
  const { code, expiresAt } = generateCodeWithExpiration(8, 1440); // 24 horas para activar

  // Crea el usuario con estado inactivo y datos básicos
  const user = await User.create({
    name,
    id_number: idNumber,
    email,
    password: hashedPassword,
    phone,
    address,
    birth_date,
    role: "user",
    status: "inactive",
    activation_code: code,
    activation_expires_at: expiresAt,
  });

  await sendActivationEmail(email, code); // Envía email con el código de activación
  return sanitizeUser(user); // Retorna el usuario sin campos sensibles
}

/**
 * Inicia sesión y entrega tokens JWT (access y refresh).
 * - Valida credenciales.
 * - Verifica que la cuenta esté activa.
 * - Genera y persiste refresh token con expiración.
 * @param {object} data - Credenciales { email, password }.
 * @returns {Promise<{accessToken:string, refreshToken:string, user:object}>}
 */
async function login(data) {
  const { error, value } = loginDto.validate(data); // Valida credenciales de entrada
  if (error) throw createHttpError(400, error.details[0].message);

  const { email, password } = value;
  const user = await User.findOne({ where: { email } }); // Busca por email
  if (!user || !(await bcrypt.compare(password, user.password))) {
    // Si no existe o la contraseña no coincide
    throw createHttpError(401, "Invalid credentials.");
  }

  if (user.status !== "active") {
    // La cuenta debe estar activada para permitir login
    throw createHttpError(
      403,
      "Account is inactive or locked. Please activate your account."
    );
  }

  const userPayload = { id: user.id, role: user.role }; // Payload mínimo para el token
  const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(userPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Fecha de expiración del refresh token
  await RefreshToken.create({
    user_id: user.id,
    token: refreshToken,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user), // Sanea campos sensibles
  };
}

/**
 * Genera un nuevo access token utilizando un refresh token válido.
 * - Valida el formato del token recibido.
 * - Verifica existencia y expiración en base de datos.
 * - Verifica la firma y devuelve un nuevo access token.
 * @param {{token:string}} tokenData - Objeto con el refresh token.
 * @returns {Promise<{accessToken:string}>}
 */
async function refreshToken(tokenData) {
  const { error, value } = tokenDto.validate(tokenData);
  if (error) throw createHttpError(401, "Refresh token is required.");

  const dbToken = await RefreshToken.findOne({ where: { token: value.token } });
  if (!dbToken) throw createHttpError(401, "Invalid refresh token.");

  if (new Date() > new Date(dbToken.expires_at)) {
    // Si el token expiró, se elimina y se rechaza
    await dbToken.destroy();
    throw createHttpError(403, "Refresh token has expired.");
  }

  try {
    const decoded = jwt.verify(value.token, process.env.JWT_REFRESH_SECRET); // Verifica firma y expiración
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error(); // Seguridad: usuario podría haber sido eliminado

    const userPayload = { id: user.id, role: user.role };
    const newAccessToken = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return { accessToken: newAccessToken };
  } catch (err) {
    // Si falla la verificación, se elimina el token de la BD y se responde 403
    await dbToken.destroy();
    throw createHttpError(403, "Invalid refresh token.");
  }
}

/**
 * Cierra sesión eliminando el refresh token almacenado.
 * - Si falta el token, simplemente no hace nada para no filtrar información.
 * @param {{token:string}} tokenData - Objeto con el refresh token.
 */
async function logout(tokenData) {
  const { error, value } = tokenDto.validate(tokenData);
  if (error) return; // Si falta el token, se ignora silenciosamente

  await RefreshToken.destroy({ where: { token: value.token } }); // Elimina el token de la BD
}

/**
 * Activa la cuenta de un usuario mediante un código de activación enviado por email.
 * - Valida email y código.
 * - Verifica expiración del código.
 * @param {{email:string, code:string}} data
 */
async function activateAccount(data) {
  const { error, value } = verifyCodeDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { email, code } = value;
  const user = await User.findOne({ where: { email, activation_code: code } });
  if (!user) throw createHttpError(400, "Invalid email or activation code.");

  if (new Date() > new Date(user.activation_expires_at)) {
    // El código de activación ha caducado
    throw createHttpError(
      400,
      "Activation code has expired. Please request a new one."
    );
  }

  // Marca como activa y limpia campos de activación
  user.status = "active";
  user.activation_code = null;
  user.activation_expires_at = null;
  await user.save();
}

/**
 * Reenvía un nuevo código de activación al correo del usuario.
 * - Solo para cuentas no activas.
 * @param {{email:string}} data
 */
async function resendActivationCode(data) {
  const { error, value } = emailDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const user = await User.findOne({ where: { email: value.email } });
  if (!user) throw createHttpError(404, "User not found.");
  if (user.status === "active")
    throw createHttpError(400, "This account is already active.");

  const { code, expiresAt } = generateCodeWithExpiration(8, 1440); // 24 horas
  user.activation_code = code;
  user.activation_expires_at = expiresAt;
  await user.save();
  await sendActivationEmail(user.email, code);
}

/**
 * Envía un código de restablecimiento de contraseña al correo del usuario.
 * - El código expira en 30 minutos.
 * @param {{email:string}} data
 */
async function requestPasswordReset(data) {
  const { error, value } = emailDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const user = await User.findOne({ where: { email: value.email } });
  if (!user) throw createHttpError(404, "User not found.");

  const { code, expiresAt } = generateCodeWithExpiration(8, 30); // 30 minutos
  user.password_reset_code = code;
  user.password_reset_expires_at = expiresAt;
  await user.save();
  await sendPasswordResetEmail(user.email, code);
}

/**
 * Restablece la contraseña de un usuario usando un código válido.
 * - Valida el DTO que incluye código y nueva contraseña.
 * - Verifica expiración del código.
 * @param {{resetCode:string, newPassword:string}} data
 */
async function resetPassword(data) {
  const { error, value } = resetPasswordDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { resetCode, newPassword } = value;
  const user = await User.findOne({
    where: { password_reset_code: resetCode },
  });
  if (!user) throw createHttpError(400, "Invalid or expired reset code.");

  if (new Date() > new Date(user.password_reset_expires_at)) {
    // Si el código caducó, se rechaza
    throw createHttpError(
      400,
      "Reset code has expired. Please request a new one."
    );
  }

  user.password = await bcrypt.hash(newPassword, 10); // Hashea la nueva contraseña
  user.password_reset_code = null; // Limpia el código
  user.password_reset_expires_at = null; // Limpia la expiración
  await user.save();
}

/**
 * Verifica la sesión de un usuario buscando su registro en la base de datos.
 * @param {number} userId - ID del usuario (proveniente del JWT decodificado).
 * @returns {object} Usuario saneado.
 * @throws {Error} 404 si el usuario no existe.
 */
async function verifyToken(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    // Si el token es válido pero el usuario ya no existe, algo ocurrió (p. ej. fue eliminado)
    throw createHttpError(
      404,
      "User associated with this token no longer exists."
    );
  }
  return sanitizeUser(user);
}

/**
 * Verifica si un código de restablecimiento de contraseña es válido y no ha caducado.
 * @param {{email:string, code:string}} data
 */
async function verifyResetCode(data) {
  const { error, value } = verifyCodeDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { email, code } = value;
  const user = await User.findOne({
    where: { email, password_reset_code: code },
  });
  if (!user) throw createHttpError(400, "Invalid email or reset code.");

  if (new Date() > new Date(user.password_reset_expires_at)) {
    throw createHttpError(
      400,
      "Reset code has expired. Please request a new one."
    );
  }
}

// Exporta las funciones del servicio
module.exports = {
  register,
  login,
  refreshToken,
  logout,
  activateAccount,
  resendActivationCode,
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
  verifyToken,
};
