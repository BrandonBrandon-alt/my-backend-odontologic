/**
 * Servicio de disponibilidades (availability).
 * Gestiona la consulta, creación, actualización y desactivación de horarios de atención
 * de los dentistas, validando solapamientos y estados, e incluyendo las relaciones necesarias.
 */
const { Availability, User, Specialty, Appointment, Op } = require("../models");
const createAvailabilityDto = require("../dtos/availability/create-availability.dto");
const updateAvailabilityDto = require("../dtos/availability/update-availability.dto");
const AvailabilityOutputDto = require("../dtos/availability/availability-output.dto");

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

/**
 * Construye una cláusula de consulta para filtrar disponibilidades futuras.
 * Considera fecha mayor a hoy o, si es hoy, que la hora de inicio sea mayor a la hora actual.
 * @returns {object} Cláusula para usar en `where` de Sequelize.
 */
const getFutureAvailabilitiesClause = () => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const currentTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS
  return {
    [Op.or]: [
      { date: { [Op.gt]: todayStr } }, // Fechas futuras
      { date: todayStr, start_time: { [Op.gt]: currentTimeStr } }, // Hoy pero más tarde
    ],
  };
};

/**
 * Obtiene todas las disponibilidades futuras activas.
 * @returns {Promise<AvailabilityOutputDto[]>} Lista de disponibilidades formateadas.
 */
async function getAll() {
  const availabilities = await Availability.findAll({
    where: {
      is_active: true, // Solo registros activos
      ...getFutureAvailabilitiesClause(), // Solo futuras
    },
    attributes: ['id', 'date', 'start_time', 'end_time', 'dentist_id', 'specialty_id'],
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] }, // Incluye dentista
      { model: Specialty, as: "specialty", attributes: ["id", "name", "description", "is_active"] }, // Incluye especialidad
    ],
    order: [
      ["date", "ASC"], // Primero por fecha
      ["start_time", "ASC"], // Luego por hora de inicio
    ],
  });
  return AvailabilityOutputDto.fromList(availabilities);
}

/**
 * Obtiene disponibilidades futuras activas filtradas por especialidad.
 * @param {number} specialtyId - ID de la especialidad.
 * @returns {Promise<AvailabilityOutputDto[]>} Lista de disponibilidades.
 */
async function getBySpecialty(specialtyId) {
  const availabilities = await Availability.findAll({
    where: {
      specialty_id: specialtyId,
      is_active: true,
      ...getFutureAvailabilitiesClause(),
    },
    attributes: ['id', 'date', 'start_time', 'end_time', 'dentist_id', 'specialty_id'],
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name", "description", "is_active"] },
    ],
    order: [
      ["date", "ASC"],
      ["start_time", "ASC"],
    ],
  });
  return AvailabilityOutputDto.fromList(availabilities);
}

/**
 * Obtiene disponibilidades futuras activas filtradas por dentista.
 * @param {number} dentistId - ID del dentista.
 * @returns {Promise<AvailabilityOutputDto[]>} Lista de disponibilidades.
 */
async function getByDentist(dentistId) {
  const availabilities = await Availability.findAll({
    where: {
      dentist_id: dentistId,
      is_active: true,
      ...getFutureAvailabilitiesClause(),
    },
    attributes: ['id', 'date', 'start_time', 'end_time', 'dentist_id', 'specialty_id'],
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name", "description", "is_active"] },
    ],
    order: [
      ["date", "ASC"],
      ["start_time", "ASC"],
    ],
  });
  return AvailabilityOutputDto.fromList(availabilities);
}

/**
 * Obtiene una disponibilidad activa por su ID.
 * @param {number} id - ID de la disponibilidad.
 * @returns {Promise<AvailabilityOutputDto>} La disponibilidad formateada.
 * @throws {Error} 404 si no existe.
 */
async function getById(id) {
  const availability = await Availability.findOne({
    where: { id, is_active: true }, // Debe estar activa
    attributes: ['id', 'date', 'start_time', 'end_time', 'dentist_id', 'specialty_id'],
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name", "description", "is_active"] },
    ],
  });
  if (!availability) {
    throw createHttpError(404, "Availability not found");
  }
  return new AvailabilityOutputDto(availability);
}

/**
 * Crea un nuevo bloque de disponibilidad.
 * - Valida entrada con DTO.
 * - Verifica que el dentista y la especialidad existan y estén activos.
 * - Verifica que no haya solapamientos con otras disponibilidades activas.
 * @param {object} availabilityData - Datos de la disponibilidad.
 * @returns {Promise<AvailabilityOutputDto>} La disponibilidad creada.
 * @throws {Error} 400/404/409 según validaciones.
 */
async function create(availabilityData) {
  const { error, value } = createAvailabilityDto.validate(availabilityData); // Valida datos de entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const dentist = await User.findOne({
    where: { id: value.dentist_id, role: "dentist", status: "active" }, // Debe ser dentista activo
    attributes: ['id', 'name'],
  });
  if (!dentist)
    throw createHttpError(404, "Dentist not found or is not active");

  const specialty = await Specialty.findOne({
    where: { id: value.specialty_id, is_active: true }, // Especialidad activa
    attributes: ['id', 'name', 'description', 'is_active'],
  });
  if (!specialty)
    throw createHttpError(404, "Specialty not found or is not active");

  // Verifica solapamiento: start_time < end_time existente Y end_time > start_time nuevo
  const conflictingAvailability = await Availability.findOne({
    where: {
      dentist_id: value.dentist_id,
      date: value.date,
      is_active: true,
      start_time: { [Op.lt]: value.end_time },
      end_time: { [Op.gt]: value.start_time },
    },
    attributes: ['id'],
  });
  if (conflictingAvailability) {
    throw createHttpError(
      409,
      "This availability conflicts with an existing one"
    );
  }

  const newAvailability = await Availability.create(value);

  // Adjunta modelos relacionados ya obtenidos para evitar consultas extra
  newAvailability.dentist = dentist;
  newAvailability.specialty = specialty;

  return new AvailabilityOutputDto(newAvailability);
}

/**
 * Actualiza un bloque de disponibilidad existente.
 * - Valida el DTO.
 * - Verifica existencia.
 * - Si cambian fecha/hora/dentista, verifica solapamientos.
 * @param {number} id - ID de la disponibilidad a actualizar.
 * @param {object} availabilityData - Datos a actualizar.
 * @returns {Promise<AvailabilityOutputDto>} La disponibilidad actualizada.
 */
async function update(id, availabilityData) {
  const { error, value } = updateAvailabilityDto.validate(availabilityData); // Valida entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const availability = await Availability.findByPk(id); // Comprueba que exista
  if (!availability) {
    throw createHttpError(404, "Availability not found");
  }

  // Solo checkea solapamientos si cambian campos relevantes
  const checkConflict =
    value.date || value.start_time || value.end_time || value.dentist_id;

  if (checkConflict) {
    const finalDentistId = value.dentist_id || availability.dentist_id;
    const finalDate = value.date || availability.date;
    const finalStartTime = value.start_time || availability.start_time;
    const finalEndTime = value.end_time || availability.end_time;

    const conflictingAvailability = await Availability.findOne({
      where: {
        id: { [Op.ne]: id }, // Excluye la disponibilidad actual
        dentist_id: finalDentistId,
        date: finalDate,
        is_active: true,
        start_time: { [Op.lt]: finalEndTime },
        end_time: { [Op.gt]: finalStartTime },
      },
      attributes: ['id'],
    });
    if (conflictingAvailability) {
      throw createHttpError(
        409,
        "This availability conflicts with an existing one"
      );
    }
  }

  await availability.update(value); // Persiste la actualización
  const updatedAvailability = await findFullAvailabilityById(id); // Recupera con relaciones

  return new AvailabilityOutputDto(updatedAvailability);
}

/**
 * Desactiva una disponibilidad (soft delete).
 * - Verifica que no existan citas pendientes o confirmadas asociadas.
 * @param {number} id - ID de la disponibilidad a desactivar.
 * @returns {Promise<{message: string}>} Mensaje de éxito.
 * @throws {Error} 404 si no existe, 400 si hay citas pendientes/confirmadas.
 */
async function deactivate(id) {
  const availability = await Availability.findByPk(id);
  if (!availability) {
    throw createHttpError(404, "Availability not found");
  }

  const pendingAppointments = await Appointment.count({
    where: {
      availability_id: id,
      status: ["pending", "confirmed"], // Estados que impiden desactivación
    },
  });
  if (pendingAppointments > 0) {
    throw createHttpError(
      400,
      "Cannot deactivate availability with pending or confirmed appointments"
    );
  }

  await availability.update({ is_active: false }); // Soft delete
  return { message: "Availability deactivated successfully." };
}

/**
 * Obtiene una disponibilidad por ID incluyendo relaciones.
 * Función de ayuda utilizada para devolver datos completos tras crear/actualizar.
 * @param {number} id - ID de la disponibilidad.
 * @returns {Promise<Availability>} Instancia con includes.
 */
const findFullAvailabilityById = async (id) => {
  return Availability.findByPk(id, {
    attributes: ['id', 'date', 'start_time', 'end_time', 'dentist_id', 'specialty_id'],
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name", "description", "is_active"] },
    ],
  });
};

// Exportaciones del servicio
module.exports = {
  getAll,
  getBySpecialty,
  getByDentist,
  getById,
  create,
  update,
  // Update function is omitted as it's complex and often better handled
  // by deactivating the old and creating a new one.
  deactivate,
};
