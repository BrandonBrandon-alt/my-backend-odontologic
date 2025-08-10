const { Specialty } = require("../models");
// We assume you will create these DTOs for validation, similar to the profile service.
const createSpecialtyDto = require("../dtos/specialty/create-specialty.dto");
const updateSpecialtyDto = require("../dtos/specialty/update-specialty.dto");
// This DTO is for formatting the output sent to the client.
const SpecialtyOutputDto = require("../dtos/specialty/specialty-output.dto");
const cache = require("../utils/cache");

/**
 * Creates a standard error object with a status code.
 * @param {number} status - The HTTP status code.
 * @param {string} message - The error message.
 * @returns {Error} A new error object with a status property.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '60000', 10);
const CACHE_KEYS = {
  all: 'specialties:all',
  byId: (id) => `specialties:${id}`,
};

/**
 * Retrieves all active specialties, ordered by name.
 * @returns {Promise<SpecialtyOutputDto[]>} A list of active specialties.
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
 * Retrieves a single active specialty by its ID.
 * @param {number} id - The ID of the specialty.
 * @returns {Promise<SpecialtyOutputDto>} The specialty object.
 * @throws {Error} Throws a 404 error if the specialty is not found.
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
 * Creates a new specialty after validating the input.
 * @param {object} specialtyData - The data for the new specialty.
 * @param {string} specialtyData.name - The name of the specialty.
 * @param {string} [specialtyData.description] - The optional description.
 * @returns {Promise<SpecialtyOutputDto>} The newly created specialty.
 * @throws {Error} Throws validation (400) or conflict (409) errors.
 */
async function create(specialtyData) {
  const { error, value } = createSpecialtyDto.validate(specialtyData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const existingSpecialty = await Specialty.findOne({
    where: { name: value.name },
  });
  if (existingSpecialty) {
    throw createHttpError(409, "A specialty with this name already exists");
  }

  const newSpecialty = await Specialty.create(value);
  // Invalidate caches
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.byId(newSpecialty.id));
  return new SpecialtyOutputDto(newSpecialty);
}

/**
 * Updates an existing specialty.
 * @param {number} id - The ID of the specialty to update.
 * @param {object} specialtyData - The new data for the specialty.
 * @returns {Promise<SpecialtyOutputDto>} The updated specialty.
 * @throws {Error} Throws validation (400), not found (404), or conflict (409) errors.
 */
async function update(id, specialtyData) {
  const { error, value } = updateSpecialtyDto.validate(specialtyData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const specialty = await Specialty.findByPk(id);
  if (!specialty) {
    throw createHttpError(404, "Specialty not found");
  }

  // Check for name conflict only if the name is being changed
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
  // Invalidate caches
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.byId(id));
  return new SpecialtyOutputDto(specialty);
}

/**
 * Deactivates a specialty (soft delete).
 * @param {number} id - The ID of the specialty to deactivate.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {Error} Throws a 404 error if the specialty is not found.
 */
async function deactivate(id) {
  const specialty = await Specialty.findByPk(id);
  if (!specialty) {
    throw createHttpError(404, "Specialty not found");
  }

  await specialty.update({ is_active: false });
  // Invalidate caches
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
