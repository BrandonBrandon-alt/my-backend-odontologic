/**
 * Controlador de disponibilidades (availability).
 * Expone endpoints para consultar, crear, actualizar y desactivar horarios
 * delegando la lógica de negocio al servicio de disponibilidades.
 */
const availabilityService = require('../services/availability.service');

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para controladores asíncronos que delega el manejo de errores a `next`.
 * @param {Function} fn - Función asíncrona (req, res, next).
 * @returns {Function} Middleware Express con captura de errores.
 */
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Obtiene todas las disponibilidades futuras activas.
 */
const getAll = asyncHandler(async (req, res, next) => {
    const data = await availabilityService.getAll();
    res.status(200).json(data);
});

/**
 * Obtiene disponibilidades por especialidad.
 */
const getBySpecialty = asyncHandler(async (req, res, next) => {
    const { specialtyId } = req.params; // ID de la especialidad desde la ruta
    const data = await availabilityService.getBySpecialty(specialtyId);
    res.status(200).json(data);
});

/**
 * Obtiene disponibilidades por dentista.
 */
const getByDentist = asyncHandler(async (req, res, next) => {
    const { dentistId } = req.params; // ID del dentista desde la ruta
    const data = await availabilityService.getByDentist(dentistId);
    res.status(200).json(data);
});

/**
 * Obtiene una disponibilidad por su ID.
 */
const getById = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // ID de la disponibilidad
    const data = await availabilityService.getById(id);
    res.status(200).json(data);
});

/**
 * Crea un nuevo bloque de disponibilidad.
 */
const create = asyncHandler(async (req, res, next) => {
    const result = await availabilityService.create(req.body);
    res.status(201).json(result);
});

/**
 * Actualiza un bloque de disponibilidad existente.
 */
const update = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // ID de la disponibilidad
    const result = await availabilityService.update(id, req.body);
    res.status(200).json(result);
});

/**
 * Desactiva (soft delete) una disponibilidad.
 */
const deactivate = asyncHandler(async (req, res, next) => {
    const { id } = req.params; // ID de la disponibilidad
    const result = await availabilityService.deactivate(id);
    res.status(200).json(result);
});

module.exports = {
    getAll,
    getBySpecialty,
    getByDentist,
    getById,
    create,
    update,
    deactivate
};
