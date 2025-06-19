// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    // Si no hay token, el usuario no está autenticado.
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Si el token es inválido o expirado.
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user; // Guarda el payload del token en req.user
    next(); // Continúa al siguiente middleware o ruta
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    // req.user debe haber sido establecido por authenticateToken
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
    }
    next(); // Continúa si el rol es autorizado
  };
}

// Exporta ambas funciones como un objeto
module.exports = {
  authenticateToken,
  authorizeRoles
};