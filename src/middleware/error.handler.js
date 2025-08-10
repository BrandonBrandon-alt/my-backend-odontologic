/**
 * Middleware global de manejo de errores.
 * Formatea la respuesta de error usando `err.status` (o 500 por defecto),
 * `err.message` y opcionalmente `err.details`.
 */
// Middleware global de manejo de errores
module.exports = (err, req, res, next) => {
    console.error('Error no manejado:', err);
    const status = err.status || 500; // Usa el status del error o 500
    res.status(status).json({
        error: err.message || 'Error interno del servidor',
        details: err.details || undefined
    });
}; 