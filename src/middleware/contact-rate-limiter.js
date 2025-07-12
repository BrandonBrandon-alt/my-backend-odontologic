const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 3, // 3 mensajes
  duration: 3600, // por hora
});

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

module.exports = contactRateLimiter; 