/**
 * Controlador de tipos de servicio (ServiceType).
 * Ofrece endpoints para listar, obtener por especialidad o ID, crear, actualizar y desactivar.
 * Toda la lógica se delega al servicio correspondiente.
 */
const serviceTypeService = require("../services/service-type.service");

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para controladores async que pasa errores a `next`.
 * @param {Function} fn - Controlador asíncrono.
 * @returns {Function} Middleware Express con manejo de errores implícito.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Lista todos los tipos de servicio activos.
 */
const getAll = asyncHandler(async (req, res, next) => {
  const data = await serviceTypeService.getAll();
  res.status(200).json(data);
});

/**
 * Lista los tipos de servicio por especialidad.
 */
const getBySpecialty = asyncHandler(async (req, res, next) => {
  const { specialtyId } = req.params; // ID de especialidad desde la ruta
  const data = await serviceTypeService.getBySpecialty(specialtyId);
  res.status(200).json(data);
});

/**
 * Obtiene un tipo de servicio por su ID.
 */
const getById = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ID del tipo de servicio desde la ruta
  const data = await serviceTypeService.getById(id);
  res.status(200).json(data);
});

/**
 * Crea un tipo de servicio.
 */
const create = asyncHandler(async (req, res, next) => {
  const result = await serviceTypeService.create(req.body);
  res.status(201).json(result);
});

/**
 * Actualiza un tipo de servicio existente.
 */
const update = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ID del tipo de servicio
  const result = await serviceTypeService.update(id, req.body);
  res.status(200).json(result);
});

/**
 * Desactiva (soft delete) un tipo de servicio.
 */
const deactivate = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ID del tipo de servicio
  const result = await serviceTypeService.deactivate(id);
  res.status(200).json(result);
});

module.exports = {
  getAll,
  getBySpecialty,
  getById,
  create,
  update,
  deactivate,
};
