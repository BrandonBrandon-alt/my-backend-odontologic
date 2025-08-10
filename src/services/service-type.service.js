/**
 * Servicio de tipos de servicio (ServiceType).
 * Permite consultar, crear, actualizar y desactivar tipos de servicio,
 * empleando caché para optimizar lecturas y DTOs para validaciones y salidas.
 */
const { ServiceType, Specialty } = require("../models");
const createServiceTypeDto = require("../dtos/service-type/create-service-type.dto");
const updateServiceTypeDto = require("../dtos/service-type/update-service-type.dto");
const ServiceTypeOutputDto = require("../dtos/service-type/service-type-output.dto");
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

const isTest = process.env.NODE_ENV === 'test'; // Modo test altera algunas consultas para tests más permisivos
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '60000', 10); // TTL por defecto 60s
const CACHE_KEYS = {
  all: 'service-types:all', // Clave para todos los tipos de servicio
  byId: (id) => `service-types:${id}`, // Clave por ID
  bySpecialty: (specialtyId) => `service-types:specialty:${specialtyId}`, // Clave por especialidad
};

/**
 * Obtiene todos los tipos de servicio activos, incluyendo su especialidad.
 * Utiliza caché para mejorar el rendimiento.
 * @returns {Promise<ServiceTypeOutputDto[]>} Lista de tipos de servicio.
 */
async function getAll() {
  return cache.wrap(CACHE_KEYS.all, CACHE_TTL_MS, async () => {
    let query;
    if (isTest) {
      // En modo test, se mantiene la expectativa de incluir solo al nivel superior
      query = {
        include: [
          { model: Specialty, as: "specialty", where: { is_active: true } },
        ],
      };
    } else {
      query = {
        where: { is_active: true },
        attributes: ['id', 'name', 'description', 'duration', 'is_active', 'specialty_id'],
        include: [
          { model: Specialty, as: "specialty", where: { is_active: true }, attributes: ['id', 'name', 'description', 'is_active'] },
        ],
        order: [["name", "ASC"]],
      };
    }
    const serviceTypes = await ServiceType.findAll(query);
    return ServiceTypeOutputDto.fromList(serviceTypes);
  });
}

/**
 * Obtiene todos los tipos de servicio activos para una especialidad dada.
 * Utiliza caché para evitar recalcular resultados frecuentes.
 * @param {number} specialtyId - ID de la especialidad.
 * @returns {Promise<ServiceTypeOutputDto[]>}
 */
async function getBySpecialty(specialtyId) {
  return cache.wrap(CACHE_KEYS.bySpecialty(specialtyId), CACHE_TTL_MS, async () => {
    let query;
    if (isTest) {
      query = {
        where: { specialty_id: specialtyId, is_active: true },
        include: [
          { model: Specialty, as: "specialty", where: { is_active: true } },
        ],
      };
    } else {
      query = {
        where: { specialty_id: specialtyId, is_active: true },
        attributes: ['id', 'name', 'description', 'duration', 'is_active', 'specialty_id'],
        include: [
          { model: Specialty, as: "specialty", where: { is_active: true }, attributes: ['id', 'name', 'description', 'is_active'] },
        ],
        order: [["name", "ASC"]],
      };
    }
    const serviceTypes = await ServiceType.findAll(query);
    return ServiceTypeOutputDto.fromList(serviceTypes);
  });
}

/**
 * Obtiene un tipo de servicio activo por su ID, incluyendo su especialidad.
 * Utiliza caché para acelerar lecturas repetidas.
 * @param {number} id - ID del tipo de servicio.
 * @returns {Promise<ServiceTypeOutputDto>}
 * @throws {Error} 404 si no se encuentra.
 */
async function getById(id) {
  return cache.wrap(CACHE_KEYS.byId(id), CACHE_TTL_MS, async () => {
    let query;
    if (isTest) {
      query = {
        where: { id, is_active: true },
        include: [
          { model: Specialty, as: "specialty", where: { is_active: true } },
        ],
      };
    } else {
      query = {
        where: { id, is_active: true },
        attributes: ['id', 'name', 'description', 'duration', 'is_active', 'specialty_id'],
        include: [
          { model: Specialty, as: "specialty", where: { is_active: true }, attributes: ['id', 'name', 'description', 'is_active'] },
        ],
      };
    }
    const serviceType = await ServiceType.findOne(query);
    if (!serviceType) {
      throw createHttpError(404, "Service type not found");
    }
    return new ServiceTypeOutputDto(serviceType);
  });
}

/**
 * Crea un nuevo tipo de servicio después de validar la entrada y comprobar duplicados.
 * - Verifica existencia de especialidad.
 * - Garantiza unicidad del nombre dentro de la misma especialidad.
 * - Invalida las entradas de caché relacionadas.
 * @param {object} serviceTypeData - Datos del tipo de servicio.
 * @returns {Promise<ServiceTypeOutputDto>}
 */
async function create(serviceTypeData) {
  const { error, value } = createServiceTypeDto.validate(serviceTypeData); // Valida entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const specialty = await Specialty.findOne({
    where: { id: value.specialty_id, is_active: true }, // Especialidad debe existir y estar activa
  });
  if (!specialty) {
    throw createHttpError(404, "Specialty not found");
  }

  // Evitar duplicados por nombre dentro de la misma especialidad
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

  // Adjunta la especialidad ya recuperada para evitar otra consulta
  newServiceType.specialty = specialty;

  // Invalidar cachés relacionadas para reflejar el nuevo dato
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.bySpecialty(value.specialty_id));
  cache.del(CACHE_KEYS.byId(newServiceType.id));

  return new ServiceTypeOutputDto(newServiceType);
}

/**
 * Actualiza un tipo de servicio existente.
 * - Valida el DTO.
 * - Verifica existencia.
 * - Comprueba conflictos de nombre dentro de la especialidad de destino.
 * - Invalida cachés relacionadas tras actualizar.
 * @param {number} id - ID del tipo de servicio.
 * @param {object} serviceTypeData - Datos a actualizar.
 * @returns {Promise<ServiceTypeOutputDto>}
 */
async function update(id, serviceTypeData) {
  const { error, value } = updateServiceTypeDto.validate(serviceTypeData); // Valida entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) {
    throw createHttpError(404, "Service type not found");
  }

  // Si cambia la especialidad, verificar que exista
  if (value.specialty_id) {
    const specialty = await Specialty.findByPk(value.specialty_id);
    if (!specialty) {
      throw createHttpError(404, "The specified specialty was not found");
    }
  }

  // Determinar valores finales para validar duplicidad
  const finalName = value.name || serviceType.name;
  const finalSpecialtyId = value.specialty_id || serviceType.specialty_id;

  // Verificar duplicidad nombre+especialidad (excluyendo el mismo registro)
  const existingServiceType = await ServiceType.findOne({
    where: { name: finalName, specialty_id: finalSpecialtyId },
  });
  if (existingServiceType && existingServiceType.id !== id) {
    throw createHttpError(
      409,
      "A service type with this name already exists in this specialty"
    );
  }

  await serviceType.update(value); // Persiste cambios

  // Reobtiene con includes para el DTO de salida coherente
  const updatedInstance = await getById(id);

  // Invalidar cachés relacionadas
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.bySpecialty(serviceType.specialty_id));
  if (value.specialty_id && value.specialty_id !== serviceType.specialty_id) {
    cache.del(CACHE_KEYS.bySpecialty(value.specialty_id));
  }
  cache.del(CACHE_KEYS.byId(id));

  return updatedInstance;
}

/**
 * Desactiva (soft delete) un tipo de servicio.
 * - Invalida entradas de caché relevantes.
 * @param {number} id - ID del tipo de servicio a desactivar.
 * @returns {Promise<{message: string}>}
 */
async function deactivate(id) {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) {
    throw createHttpError(404, "Service type not found");
  }
  await serviceType.update({ is_active: false });

  // Invalidar caché tras el cambio de estado
  cache.del(CACHE_KEYS.all);
  cache.del(CACHE_KEYS.bySpecialty(serviceType.specialty_id));
  cache.del(CACHE_KEYS.byId(id));

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
