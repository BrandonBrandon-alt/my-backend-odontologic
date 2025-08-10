const {
  Appointment,
  GuestPatient,
  User,
  Availability,
  ServiceType,
  Specialty,
  sequelize,
} = require("../models"); // Import sequelize for transactions
const createGuestAppointmentDto = require("../dtos/appointment/create-guest-appointment.dto");
const createUserAppointmentDto = require("../dtos/appointment/create-user-appointment.dto");
const updateAppointmentStatusDto = require("../dtos/appointment/update-appointment-status.dto");
const AppointmentOutputDto = require("../dtos//appointment/appointment-output.dto");

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
 * Fetches an appointment by its ID and includes all related data for output.
 * @param {number} appointmentId - The ID of the appointment.
 * @returns {Promise<Appointment>} A Sequelize appointment object with includes.
 */
const findFullAppointmentById = async (appointmentId) => {
  return Appointment.findByPk(appointmentId, {
    attributes: ['id', 'status', 'notes', 'createdAt', 'user_id', 'guest_patient_id', 'availability_id', 'service_type_id'],
    include: [
      { model: GuestPatient, as: "guestPatient", attributes: ['id', 'name', 'email', 'phone'] },
      { model: User, as: "user", attributes: ['id', 'name', 'email', 'phone'] },
      {
        model: Availability,
        as: "availability",
        attributes: ['id', 'date', 'start_time', 'end_time'],
        include: [
          { model: User, as: "dentist", attributes: ["id", "name"] },
          { model: Specialty, as: "specialty", attributes: ['id', 'name', 'description', 'is_active'] },
        ],
      },
      { model: ServiceType, as: "serviceType", attributes: ['id', 'name', 'description', 'duration', 'is_active'], include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'description', 'is_active'] }] },
    ],
  });
};

/**
 * Creates a new appointment for either a guest or a registered user.
 * @param {object} appointmentData - The data for the new appointment.
 * @param {object} [user] - The authenticated user object, if applicable.
 * @returns {Promise<AppointmentOutputDto>} The newly created appointment.
 */
async function create(appointmentData, user = null) {
  const isGuest = !user;
  const schema = isGuest ? createGuestAppointmentDto : createUserAppointmentDto;

  const { error, value } = schema.validate(appointmentData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  // --- Business Logic Validation ---
  const availability = await Availability.findOne({
    where: { id: value.availability_id, is_active: true },
    attributes: ['id'],
  });
  if (!availability) {
    throw createHttpError(
      404,
      "The selected availability slot was not found or is not active."
    );
  }

  const serviceType = await ServiceType.findOne({
    where: { id: value.service_type_id, is_active: true },
    attributes: ['id'],
  });
  if (!serviceType) {
    throw createHttpError(
      404,
      "The selected service type was not found or is not active."
    );
  }
  // --- End Validation ---

  const result = await sequelize.transaction(async (t) => {
    let guestPatientId = null;

    if (isGuest) {
      // Find an existing guest by email or create a new one if not found.
      const [guest] = await GuestPatient.findOrCreate({
        where: { email: value.email },
        defaults: {
          name: value.name,
          phone: value.phone,
          email: value.email,
        },
        transaction: t,
      });
      guestPatientId = guest.id;
    }

    const newAppointment = await Appointment.create(
      {
        user_id: isGuest ? null : user.id,
        guest_patient_id: guestPatientId,
        availability_id: value.availability_id,
        service_type_id: value.service_type_id,
        notes: value.notes,
        status: "pending",
      },
      { transaction: t }
    );

    return newAppointment;
  });

  const fullAppointment = await findFullAppointmentById(result.id);
  return new AppointmentOutputDto(fullAppointment);
}

/**
 * Retrieves all appointments for the currently authenticated user with pagination.
 * @param {object} user - The authenticated user object.
 * @param {object} query - Query parameters for pagination (page, limit).
 * @returns {Promise<{appointments: AppointmentOutputDto[], pagination: object}>}
 */
async function getMyAppointments(user, query = {}) {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Appointment.findAndCountAll({
    where: { user_id: user.id },
    attributes: ['id', 'status', 'notes', 'createdAt', 'availability_id', 'service_type_id'],
    include: [
      {
        model: Availability,
        as: "availability",
        attributes: ['id', 'date', 'start_time', 'end_time'],
        include: [{ model: User, as: "dentist", attributes: ["id", "name"] }],
      },
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ['id', 'name', 'description', 'duration', 'is_active', 'specialty_id'],
        include: [{ model: Specialty, as: "specialty", attributes: ["name", 'id', 'description', 'is_active'] }],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    appointments: AppointmentOutputDto.fromList(rows),
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
    },
  };
}

/**
 * Updates the status of a specific appointment.
 * @param {number} appointmentId - The ID of the appointment to update.
 * @param {object} statusData - The new status data.
 * @returns {Promise<AppointmentOutputDto>} The updated appointment.
 */
async function updateStatus(appointmentId, statusData) {
  const { error, value } = updateAppointmentStatusDto.validate(statusData);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    throw createHttpError(404, "Appointment not found");
  }

  await appointment.update({ status: value.status });

  const fullAppointment = await findFullAppointmentById(appointmentId);
  return new AppointmentOutputDto(fullAppointment);
}

module.exports = {
  create,
  getMyAppointments,
  updateStatus,
};
