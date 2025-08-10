/**
 * Middleware de autenticación y autorización.
 * - Autentica usuarios mediante JWT desde el header Authorization.
 * - Autoriza acceso por roles en rutas protegidas.
 */
const jwt = require('jsonwebtoken');

/**
 * Crea un objeto de error estándar con código de estado.
 * Idealmente debería estar en un util compartido.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje de error.
 * @returns {Error}
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Middleware de Express para autenticar un usuario vía JWT.
 * Verifica el token del header 'Authorization' y adjunta el payload decodificado
 * en `req.user`.
 * @param {object} req - Objeto Request de Express.
 * @param {object} res - Objeto Response de Express.
 * @param {function} next - Siguiente middleware.
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer <TOKEN>

    if (!token) {
      throw createHttpError(401, 'Authentication token is required.');
    }

    // Caso especial para entorno de test
    if (process.env.NODE_ENV === 'test' && token === 'test-token') {
      req.user = { id: 1, role: 'test' }; // Usuario simulado
      return next();
    }

    const decodedUser = jwt.verify(token, process.env.JWT_SECRET); // Verifica firma/exp
    req.user = decodedUser; // Adjunta el payload al request
    next();
  } catch (error) {
    // Captura errores de jwt.verify (expirado, inválido, etc.)
    next(createHttpError(403, 'Invalid or expired token.'));
  }
};

/**
 * Fábrica de middleware de autorización por roles.
 * Debe usarse después de `authenticateToken`.
 * @param {...string} allowedRoles - Lista de roles permitidos para la ruta.
 * @returns {function} Middleware de Express.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // `req.user` debe estar definido por el middleware de autenticación
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
