const { Availability, User, Specialty, Appointment, Op } = require("../models");
const createAvailabilityDto = require("../dtos/availability/create-availability.dto");
const updateAvailabilityDto = require("../dtos/availability/update-availability.dto");
const AvailabilityOutputDto = require("../dtos/availability/availability-output.dto");

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
 * Builds a query clause to filter out past availabilities.
 * @returns {object} A Sequelize query clause.
 */
const getFutureAvailabilitiesClause = () => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentTimeStr = now.toTimeString().slice(0, 8);
  return {
    [Op.or]: [
      { date: { [Op.gt]: todayStr } },
      { date: todayStr, start_time: { [Op.gt]: currentTimeStr } },
    ],
  };
};

/**
 * Retrieves all future active availabilities.
 * @returns {Promise<AvailabilityOutputDto[]>} A list of availabilities.
 */
async function getAll() {
  const availabilities = await Availability.findAll({
    where: {
      is_active: true,
      ...getFutureAvailabilitiesClause(),
    },
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name"] },
    ],
    order: [
      ["date", "ASC"],
      ["start_time", "ASC"],
    ],
  });
  return AvailabilityOutputDto.fromList(availabilities);
}

/**
 * Retrieves future active availabilities by specialty.
 * @param {number} specialtyId - The ID of the specialty.
 * @returns {Promise<AvailabilityOutputDto[]>} A list of availabilities.
 */
async function getBySpecialty(specialtyId) {
  const availabilities = await Availability.findAll({
    where: {
      specialty_id: specialtyId,
      is_active: true,
      ...getFutureAvailabilitiesClause(),
    },
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name"] },
    ],
    order: [
      ["date", "ASC"],
      ["start_time", "ASC"],
    ],
  });
  return AvailabilityOutputDto.fromList(availabilities);
}

/**
 * Retrieves future active availabilities by dentist.
 * @param {number} dentistId - The ID of the dentist.
 * @returns {Promise<AvailabilityOutputDto[]>} A list of availabilities.
 */
async function getByDentist(dentistId) {
  const availabilities = await Availability.findAll({
    where: {
      dentist_id: dentistId,
      is_active: true,
      ...getFutureAvailabilitiesClause(),
    },
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name"] },
    ],
    order: [
      ["date", "ASC"],
      ["start_time", "ASC"],
    ],
  });
  return AvailabilityOutputDto.fromList(availabilities);
}

/**
 * Retrieves a single active availability by its ID.
 * @param {number} id - The ID of the availability.
 * @returns {Promise<AvailabilityOutputDto>} The availability object.
 * @throws {Error} Throws a 404 error if not found.
 */
async function getById(id) {
  const availability = await Availability.findOne({
    where: { id, is_active: true },
    include: [
      { model: User, as: "dentist", attributes: ["id", "name"] },
      { model: Specialty, as: "specialty", attributes: ["id", "name"] },
    ],
  });
  if (!availability) {
    throw createHttpError(404, "Availability not found");
  }
  return new AvailabilityOutputDto(availability);
}

/**
 * Creates a new availability slot.
 * @param {object} availabilityData - The data for the new availability.
 * @returns {Promise<AvailabilityOutputDto>} The newly created availability.
 * @throws {Error} Throws validation, not found, or conflict errors.
 */
async function create(availabilityData) {
  const { error, value } = createAvailabilityDto.validate(availabilityData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const dentist = await User.findOne({
    where: { id: value.dentist_id, role: "dentist", status: "active" },
  });
  if (!dentist)
    throw createHttpError(404, "Dentist not found or is not active");

  const specialty = await Specialty.findOne({
    where: { id: value.specialty_id, is_active: true },
  });
  if (!specialty)
    throw createHttpError(404, "Specialty not found or is not active");

  const conflictingAvailability = await Availability.findOne({
    where: {
      dentist_id: value.dentist_id,
      date: value.date,
      is_active: true,
      start_time: { [Op.lt]: value.end_time },
      end_time: { [Op.gt]: value.start_time },
    },
  });
  if (conflictingAvailability) {
    throw createHttpError(
      409,
      "This availability conflicts with an existing one"
    );
  }

  const newAvailability = await Availability.create(value);

  // Attach related models we already fetched to avoid extra DB calls
  newAvailability.dentist = dentist;
  newAvailability.specialty = specialty;

  return new AvailabilityOutputDto(newAvailability);
}

/**
 * Updates an existing availability slot.
 * @param {number} id - The ID of the availability to update.
 * @param {object} availabilityData - The new data for the availability.
 * @returns {Promise<AvailabilityOutputDto>} The updated availability.
 */
async function update(id, availabilityData) {
  const { error, value } = updateAvailabilityDto.validate(availabilityData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const availability = await Availability.findByPk(id);
  if (!availability) {
    throw createHttpError(404, "Availability not found");
  }

  // Check for conflicts only if date, time, or dentist are being changed.
  const checkConflict =
    value.date || value.start_time || value.end_time || value.dentist_id;

  if (checkConflict) {
    const finalDentistId = value.dentist_id || availability.dentist_id;
    const finalDate = value.date || availability.date;
    const finalStartTime = value.start_time || availability.start_time;
    const finalEndTime = value.end_time || availability.end_time;

    const conflictingAvailability = await Availability.findOne({
      where: {
        id: { [Op.ne]: id }, // Exclude the current availability from the check
        dentist_id: finalDentistId,
        date: finalDate,
        is_active: true,
        start_time: { [Op.lt]: finalEndTime },
        end_time: { [Op.gt]: finalStartTime },
      },
    });
    if (conflictingAvailability) {
      throw createHttpError(
        409,
        "This availability conflicts with an existing one"
      );
    }
  }

  await availability.update(value);
  const updatedAvailability = await findFullAvailabilityById(id);

  return new AvailabilityOutputDto(updatedAvailability);
}

/**
 * Deactivates an availability slot.
 * @param {number} id - The ID of the availability to deactivate.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {Error} Throws a 404 error if not found or 400 if there are pending appointments.
 */
async function deactivate(id) {
  const availability = await Availability.findByPk(id);
  if (!availability) {
    throw createHttpError(404, "Availability not found");
  }

  const pendingAppointments = await Appointment.count({
    where: {
      availability_id: id,
      status: ["pending", "confirmed"],
    },
  });
  if (pendingAppointments > 0) {
    throw createHttpError(
      400,
      "Cannot deactivate availability with pending or confirmed appointments"
    );
  }

  await availability.update({ is_active: false });
  return { message: "Availability deactivated successfully." };
}

module.exports = {
  getAll,
  getBySpecialty,
  getByDentist,
  getById,
  create,
  // Update function is omitted as it's complex and often better handled
  // by deactivating the old and creating a new one.
  deactivate,
};
