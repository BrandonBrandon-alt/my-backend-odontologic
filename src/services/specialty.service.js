/**
 * Servicio de especialidades (Specialty).
 * Ofrece operaciones CRUD básicas con validación mediante DTOs y cacheo para lecturas frecuentes.
 */
const { Specialty } = require("../models");
// Se asume que existen DTOs similares a otros servicios para validar entradas
const createSpecialtyDto = require("../dtos/specialty/create-specialty.dto");
const updateSpecialtyDto = require("../dtos/specialty/update-specialty.dto");
// DTO para formatear la salida enviada al cliente
const SpecialtyOutputDto = require("../dtos/specialty/specialty-output.dto");
const cache = require("../utils/cache");

/**
 * Crea un error HTTP estándar con código de estado.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje del error.
 * @returns {Error} Error con propiedad `status`.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '60000', 10); // TTL de caché (60s por defecto)
const CACHE_KEYS = {
  all: 'specialties:all', // Clave para todas las especialidades
  byId: (id) => `specialties:${id}`, // Clave por ID de especialidad
};

/**
 * Obtiene todas las especialidades activas ordenadas por nombre.
 * Usa caché para evitar consultas repetitivas.
 * @returns {Promise<SpecialtyOutputDto[]>} Lista de especialidades activas.
 */
async function getAll() {
  return cache.wrap(CACHE_KEYS.all, CACHE_TTL_MS, async () => {
    const specialties = await Specialty.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'description', 'is_active'],
      order: [["name", "ASC"]],
    });
    return SpecialtyOutputDto.fromList(specialties);
  });
}

/**
 * Obtiene una especialidad activa por su ID.
 * Usa caché para acelerar consultas.
 * @param {number} id - ID de la especialidad.
 * @returns {Promise<SpecialtyOutputDto>} La especialidad solicitada.
 * @throws {Error} 404 si no se encuentra.
 */
async function getById(id) {
  return cache.wrap(CACHE_KEYS.byId(id), CACHE_TTL_MS, async () => {
    const specialty = await Specialty.findOne({
      where: { id, is_active: true },
      attributes: ['id', 'name', 'description', 'is_active'],
    });
    if (!specialty) {
      throw createHttpError(404, "Specialty not found");
    }
    return new SpecialtyOutputDto(specialty);
  });
}

/**
 * Crea una nueva especialidad tras validar los datos y verificar duplicados.
 * - Invalida cachés relacionadas para reflejar el nuevo dato.
 * @param {object} specialtyData - Datos de la especialidad.
 * @returns {Promise<SpecialtyOutputDto>}
 */
async function create(specialtyData) {
  const { error, value } = createSpecialtyDto.validate(specialtyData); // Valida entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  // Evitar duplicado por nombre
  const existingSpecialty = await Specialty.findOne({
    where: { name: value.name },
  });
  if (existingSpecialty) {
    throw createHttpError(409, "A specialty with this name already exists");
  }

  const newSpecialty = await Specialty.create(value);
  // Invalidar cachés relacionadas
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.byId(newSpecialty.id));
  return new SpecialtyOutputDto(newSpecialty);
}

/**
 * Actualiza una especialidad existente.
 * - Valida el DTO.
 * - Verifica existencia y conflicto de nombre cuando aplique.
 * - Invalida entradas de caché.
 * @param {number} id - ID de la especialidad a actualizar.
 * @param {object} specialtyData - Datos a actualizar.
 * @returns {Promise<SpecialtyOutputDto>}
 */
async function update(id, specialtyData) {
  const { error, value } = updateSpecialtyDto.validate(specialtyData); // Valida entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const specialty = await Specialty.findByPk(id);
  if (!specialty) {
    throw createHttpError(404, "Specialty not found");
  }

  // Si cambia el nombre, verificar que no exista otro igual
  if (value.name && value.name !== specialty.name) {
    const existingSpecialty = await Specialty.findOne({
      where: { name: value.name },
    });
    if (existingSpecialty) {
      throw createHttpError(
        409,
        "Another specialty with this name already exists"
      );
    }
  }

  await specialty.update(value);
  // Invalidar caché para reflejar cambios
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.byId(id));
  return new SpecialtyOutputDto(specialty);
}

/**
 * Desactiva (soft delete) una especialidad.
 * - Invalida cachés para mantener coherencia en lecturas.
 * @param {number} id - ID de la especialidad a desactivar.
 * @returns {Promise<{message: string}>}
 */
async function deactivate(id) {
  const specialty = await Specialty.findByPk(id);
  if (!specialty) {
    throw createHttpError(404, "Specialty not found");
  }

  await specialty.update({ is_active: false });
  // Invalidar cachés
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.byId(id));
  return { message: "Specialty deactivated successfully." };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deactivate,
};
