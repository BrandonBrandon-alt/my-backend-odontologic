/**
 * Controlador de autenticación y cuentas de usuario.
 * Orquesta las solicitudes HTTP y delega la lógica al servicio de autenticación.
 */
const authService = require("../services/auth.service");

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para funciones async que redirige errores al middleware de manejo de errores.
 * @param {Function} fn - Controlador asíncrono.
 * @returns {Function} Middleware Express con manejo de errores implícito.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Registra un nuevo usuario y envía un código de activación al correo.
 */
const register = asyncHandler(async (req, res, next) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    message:
      "User registered successfully. Please check your email to activate your account.",
    user,
  });
});

/**
 * Inicia sesión y retorna tokens (access y refresh) junto con el usuario.
 */
const login = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  // Nota: Por seguridad adicional, se podrían establecer cookies HttpOnly
  // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(200).json({
    message: "Login successful.",
    accessToken,
    refreshToken, // Se envía en el cuerpo para almacenamiento del cliente
    user,
  });
});

/**
 * Activa una cuenta mediante código de activación.
 */
const activateAccount = asyncHandler(async (req, res, next) => {
  await authService.activateAccount(req.body);
  res.status(200).json({ message: "Account activated successfully." });
});

/**
 * Reenvía un nuevo código de activación al correo del usuario.
 */
const resendActivationCode = asyncHandler(async (req, res, next) => {
  await authService.resendActivationCode(req.body);
  res.status(200).json({
    message: "Activation code has been resent. Please check your email.",
  });
});

/**
 * Solicita el envío de un código de restablecimiento de contraseña al correo.
 */
const requestPasswordReset = asyncHandler(async (req, res, next) => {
  await authService.requestPasswordReset(req.body);
  res.status(200).json({
    message: "Password reset instructions have been sent to your email.",
  });
});

/**
 * Restablece la contraseña utilizando el código recibido por correo.
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  await authService.resetPassword(req.body);
  res.status(200).json({ message: "Password has been reset successfully." });
});

/**
 * Verifica si un código de restablecimiento es válido.
 */
const verifyResetCode = asyncHandler(async (req, res, next) => {
  await authService.verifyResetCode(req.body);
  res.status(200).json({ message: "Reset code is valid." });
});

/**
 * Genera un nuevo access token a partir de un refresh token.
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  // Aceptar refreshToken desde body o cookie
  const bodyToken = req.body && req.body.refreshToken;
  const cookieToken =
    req.cookies && (req.cookies.refreshToken || req.cookies.rt);
  const token = bodyToken || cookieToken;

  if (!token) {
    return res.status(400).json({ message: "refreshToken is required" });
  }

  const { accessToken } = await authService.refreshToken({
    token,
  });
  res.status(200).json({ accessToken });
});

/**
 * Cierra sesión eliminando el refresh token en servidor.
 */
const logout = asyncHandler(async (req, res, next) => {
  const bodyToken = req.body && req.body.refreshToken;
  const cookieToken =
    req.cookies && (req.cookies.refreshToken || req.cookies.rt);
  const token = bodyToken || cookieToken;
  if (!token) {
    // No provocar error 500: simplemente responder 204 idempotente
    return res.status(204).send();
  }
  await authService.logout({ token });
  res.status(204).send();
});

/**
 * Verifica el token del usuario autenticado (req.user es agregado por el middleware).
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  // El middleware de autenticación ya agregó el payload a req.user
  const user = await authService.verifyToken(req.user.id);
  res.status(200).json({
    message: "Token is valid.",
    user,
  });
});

module.exports = {
  register,
  activateAccount,
  login,
  refreshToken,
  logout,
  resendActivationCode,
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
  verifyToken,
};
