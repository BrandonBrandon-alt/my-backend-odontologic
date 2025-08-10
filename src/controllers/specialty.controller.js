/**
 * Controlador de especialidades (Specialty).
 * Define endpoints para listar, obtener por ID, crear, actualizar y desactivar especialidades.
 * La lógica de negocio se delega al servicio de especialidades.
 */
const specialtyService = require("../services/specialty.service");

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para controladores async que canaliza errores hacia `next`.
 * @param {Function} fn - Controlador asíncrono.
 * @returns {Function} Middleware Express con captura de errores.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Lista todas las especialidades activas.
 */
const getAll = asyncHandler(async (req, res, next) => {
  const data = await specialtyService.getAll();
  res.status(200).json(data);
});

/**
 * Obtiene una especialidad por su ID.
 */
const getById = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ID de la especialidad
  const data = await specialtyService.getById(id);
  res.status(200).json(data);
});

/**
 * Crea una nueva especialidad.
 */
const create = asyncHandler(async (req, res, next) => {
  const result = await specialtyService.create(req.body);
  res.status(201).json(result);
});

/**
 * Actualiza una especialidad existente.
 */
const update = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ID de la especialidad
  const result = await specialtyService.update(id, req.body);
  res.status(200).json(result);
});

/**
 * Desactiva (soft delete) una especialidad.
 */
const deactivate = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ID de la especialidad
  const result = await specialtyService.deactivate(id);
  res.status(200).json(result);
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  deactivate,
};
