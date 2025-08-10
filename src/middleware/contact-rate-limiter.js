const { RateLimiterMemory } = require('rate-limiter-flexible');

if (process.env.NODE_ENV === 'test') {
  const noop = async (req, res, next) => next();
  noop.resetRateLimit = async () => {};
  module.exports = noop;
} else {
  const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 10, // 10 mensajes
    duration: 3600, // por hora
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

  contactRateLimiter.resetRateLimit = resetRateLimit;

  module.exports = contactRateLimiter;
} 