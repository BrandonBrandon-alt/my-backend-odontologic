/**
 * Middleware de rate limiting para el endpoint de contacto.
 * Limita a 10 mensajes por IP por hora para mitigar spam/abuso.
 */
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configuración del limitador en memoria (apto para una sola instancia)
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip, // Usa la IP del cliente como clave
  points: 10, // 10 mensajes
  duration: 3600, // por hora (segundos)
});

// Método para resetear el contador de una IP (solo para desarrollo)
async function resetRateLimit(ip) {
  try {
    await rateLimiter.delete(ip);
    console.log(`Contador de rate limit reseteado para IP: ${ip}`);
  } catch (e) {
    console.log('No se pudo resetear el rate limit:', e.message);
  }
}

// Middleware que consume un punto por solicitud y bloquea al exceder el límite
const contactRateLimiter = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    return res.status(429).json({
      success: false,
      message: 'Demasiados mensajes. Inténtalo más tarde.'
    });
  }
};

// Exponer helper para pruebas/desarrollo
contactRateLimiter.resetRateLimit = resetRateLimit;

module.exports = contactRateLimiter; 