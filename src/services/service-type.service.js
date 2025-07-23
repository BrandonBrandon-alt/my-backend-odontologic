const { ServiceType, Specialty } = require("../models");
const createServiceTypeDto = require("../dtos/service-type/service-type-output.dto");
const updateServiceTypeDto = require("../dtos/service-type/update-service-type.dto");
const ServiceTypeOutputDto = require("../dtos/service-type/service-type-output.dto");

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

/**
 * Retrieves all active service types, including their specialty.
 * @returns {Promise<ServiceTypeOutputDto[]>} A list of active service types.
 */
async function getAll() {
  const serviceTypes = await ServiceType.findAll({
    where: { is_active: true },
    include: [
      { model: Specialty, as: "specialty", where: { is_active: true } },
    ],
    order: [["name", "ASC"]],
  });
  return ServiceTypeOutputDto.fromList(serviceTypes);
}

/**
 * Retrieves all active service types for a specific specialty.
 * @param {number} specialtyId - The ID of the specialty.
 * @returns {Promise<ServiceTypeOutputDto[]>} A list of service types for the given specialty.
 */
async function getBySpecialty(specialtyId) {
  const serviceTypes = await ServiceType.findAll({
    where: { specialty_id: specialtyId, is_active: true },
    include: [
      { model: Specialty, as: "specialty", where: { is_active: true } },
    ],
    order: [["name", "ASC"]],
  });
  return ServiceTypeOutputDto.fromList(serviceTypes);
}

/**
 * Retrieves a single active service type by its ID, including its specialty.
 * @param {number} id - The ID of the service type.
 * @returns {Promise<ServiceTypeOutputDto>} The service type object.
 * @throws {Error} Throws a 404 error if not found.
 */
async function getById(id) {
  const serviceType = await ServiceType.findOne({
    where: { id, is_active: true },
    include: [
      { model: Specialty, as: "specialty", where: { is_active: true } },
    ],
  });
  if (!serviceType) {
    throw createHttpError(404, "Service type not found");
  }
  return new ServiceTypeOutputDto(serviceType);
}

/**
 * Creates a new service type after validating the input and checking for duplicates.
 * @param {object} serviceTypeData - The data for the new service type.
 * @returns {Promise<ServiceTypeOutputDto>} The newly created service type.
 * @throws {Error} Throws validation, not found, or conflict errors.
 */
async function create(serviceTypeData) {
  const { error, value } = createServiceTypeDto.validate(serviceTypeData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const specialty = await Specialty.findOne({
    where: { id: value.specialty_id, is_active: true },
  });
  if (!specialty) {
    throw createHttpError(404, "Specialty not found");
  }

  const existingServiceType = await ServiceType.findOne({
    where: { name: value.name, specialty_id: value.specialty_id },
  });
  if (existingServiceType) {
    throw createHttpError(
      409,
      "A service type with this name already exists in this specialty"
    );
  }

  const newServiceType = await ServiceType.create(value);

  // Attach the specialty object we already fetched to avoid another DB call
  newServiceType.specialty = specialty;

  return new ServiceTypeOutputDto(newServiceType);
}

/**
 * Updates an existing service type.
 * @param {number} id - The ID of the service type to update.
 * @param {object} serviceTypeData - The new data for the service type.
 * @returns {Promise<ServiceTypeOutputDto>} The updated service type.
 * @throws {Error} Throws validation, not found, or conflict errors.
 */
async function update(id, serviceTypeData) {
  const { error, value } = updateServiceTypeDto.validate(serviceTypeData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) {
    throw createHttpError(404, "Service type not found");
  }

  // If specialty is being changed, ensure the new one exists.
  if (value.specialty_id) {
    const specialty = await Specialty.findByPk(value.specialty_id);
    if (!specialty) {
      throw createHttpError(404, "The specified specialty was not found");
    }
  }

  const finalName = value.name || serviceType.name;
  const finalSpecialtyId = value.specialty_id || serviceType.specialty_id;

  const existingServiceType = await ServiceType.findOne({
    where: { name: finalName, specialty_id: finalSpecialtyId },
  });
  if (existingServiceType && existingServiceType.id !== id) {
    throw createHttpError(
      409,
      "A service type with this name already exists in this specialty"
    );
  }

  await serviceType.update(value);

  // Re-fetch the instance to get the included specialty for the output DTO
  const updatedInstance = await getById(id);

  return updatedInstance;
}

/**
 * Deactivates a service type (soft delete).
 * @param {number} id - The ID of the service type to deactivate.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {Error} Throws a 404 error if not found.
 */
async function deactivate(id) {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) {
    throw createHttpError(404, "Service type not found");
  }
  await serviceType.update({ is_active: false });
  return { message: "Service type deactivated successfully." };
}

module.exports = {
  getAll,
  getBySpecialty,
  getById,
  create,
  update,
  deactivate,
};
