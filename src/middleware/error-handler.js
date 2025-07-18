// Middleware global de manejo de errores
module.exports = (err, req, res, next) => {
    console.error('Error no manejado:', err);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Error interno del servidor',
        details: err.details || undefined
    });
}; 