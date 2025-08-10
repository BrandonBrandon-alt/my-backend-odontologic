/**
 * Servicio de gestión de citas (appointments).
 * Proporciona funciones para crear citas (para invitados o usuarios registrados),
 * listar las citas del usuario autenticado con paginación y actualizar el estado de una cita.
 * Utiliza Sequelize para consultas y transacciones, y DTOs para validación y salida.
 */
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
 * Crea un objeto de error HTTP con un código de estado.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje descriptivo del error.
 * @returns {Error} Error con propiedad `status` asignada.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Obtiene una cita por su ID incluyendo todas las relaciones necesarias para la salida.
 * @param {number} appointmentId - ID de la cita.
 * @returns {Promise<Appointment>} Objeto de cita de Sequelize con sus relaciones incluidas.
 */
const findFullAppointmentById = async (appointmentId) => {
  // Se seleccionan atributos específicos para optimizar la respuesta y evitar datos innecesarios
  return Appointment.findByPk(appointmentId, {
    attributes: ['id', 'status', 'notes', 'createdAt', 'user_id', 'guest_patient_id', 'availability_id', 'service_type_id'],
    include: [
      // Incluye información del paciente invitado (si aplica)
      { model: GuestPatient, as: "guestPatient", attributes: ['id', 'name', 'email', 'phone'] },
      // Incluye información del usuario (si aplica)
      { model: User, as: "user", attributes: ['id', 'name', 'email', 'phone'] },
      {
        model: Availability,
        as: "availability",
        attributes: ['id', 'date', 'start_time', 'end_time'],
        include: [
          // Dentista asociado al horario de disponibilidad
          { model: User, as: "dentist", attributes: ["id", "name"] },
          // Especialidad asociada a la disponibilidad
          { model: Specialty, as: "specialty", attributes: ['id', 'name', 'description', 'is_active'] },
        ],
      },
      // Tipo de servicio solicitado (incluye su especialidad)
      { model: ServiceType, as: "serviceType", attributes: ['id', 'name', 'description', 'duration', 'is_active'], include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name', 'description', 'is_active'] }] },
    ],
  });
};

/**
 * Crea una nueva cita para un invitado o un usuario registrado.
 * - Valida la entrada con el DTO adecuado según si es invitado o usuario.
 * - Verifica que la disponibilidad y el tipo de servicio estén activos.
 * - Si es invitado, crea o reutiliza un registro de `GuestPatient` por email.
 * - Crea la cita dentro de una transacción para asegurar consistencia.
 * @param {object} appointmentData - Datos de la nueva cita.
 * @param {object} [user=null] - Usuario autenticado (si existe). Si es null, se considera invitado.
 * @returns {Promise<AppointmentOutputDto>} La cita creada en formato de salida.
 */
async function create(appointmentData, user = null) {
  const isGuest = !user; // Determina si la creación es para un invitado (no autenticado)
  const schema = isGuest ? createGuestAppointmentDto : createUserAppointmentDto; // Selecciona el esquema de validación adecuado

  const { error, value } = schema.validate(appointmentData); // Valida los datos de entrada
  if (error) {
    // Si la validación falla, se lanza un error 400 con el detalle
    throw createHttpError(400, error.details[0].message);
  }

  // --- Validación de reglas de negocio ---
  const availability = await Availability.findOne({
    where: { id: value.availability_id, is_active: true }, // La disponibilidad debe existir y estar activa
    attributes: ['id'],
  });
  if (!availability) {
    throw createHttpError(
      404,
      "The selected availability slot was not found or is not active."
    );
  }

  const serviceType = await ServiceType.findOne({
    where: { id: value.service_type_id, is_active: true }, // El tipo de servicio debe existir y estar activo
    attributes: ['id'],
  });
  if (!serviceType) {
    throw createHttpError(
      404,
      "The selected service type was not found or is not active."
    );
  }
  // --- Fin de validación ---

  // Se utiliza una transacción para garantizar que la creación del invitado (si aplica)
  // y la creación de la cita sean atómicas (todas o ninguna)
  const result = await sequelize.transaction(async (t) => {
    let guestPatientId = null; // ID del paciente invitado, si corresponde

    if (isGuest) {
      // Busca un invitado existente por email o crea uno nuevo si no existe
      const [guest] = await GuestPatient.findOrCreate({
        where: { email: value.email },
        defaults: {
          name: value.name,
          phone: value.phone,
          email: value.email,
        },
        transaction: t, // Asegura que la operación esté dentro de la transacción
      });
      guestPatientId = guest.id; // Guarda el ID del invitado para asociarlo a la cita
    }

    // Crea la cita con estado inicial "pending"
    const newAppointment = await Appointment.create(
      {
        user_id: isGuest ? null : user.id, // Si es invitado, no hay user_id
        guest_patient_id: guestPatientId, // Si no es invitado, queda en null
        availability_id: value.availability_id, // Relaciona la disponibilidad elegida
        service_type_id: value.service_type_id, // Relaciona el tipo de servicio
        notes: value.notes, // Notas opcionales
        status: "pending", // Estado inicial de la cita
      },
      { transaction: t }
    );

    return newAppointment; // Devuelve la cita creada dentro de la transacción
  });

  // Se recupera la cita completa con sus relaciones para la salida
  const fullAppointment = await findFullAppointmentById(result.id);
  return new AppointmentOutputDto(fullAppointment);
}

/**
 * Obtiene todas las citas del usuario autenticado con paginación.
 * - Calcula `offset` a partir de `page` y `limit`.
 * - Incluye disponibilidad y tipo de servicio en cada cita.
 * @param {object} user - Objeto de usuario autenticado.
 * @param {object} query - Parámetros de paginación (page, limit).
 * @returns {Promise<{appointments: AppointmentOutputDto[], pagination: object}>} Lista paginada de citas y metadatos.
 */
async function getMyAppointments(user, query = {}) {
  const { page = 1, limit = 10 } = query; // Valores por defecto para paginación
  const offset = (page - 1) * limit; // Calcula el desplazamiento para la consulta

  const { count, rows } = await Appointment.findAndCountAll({
    where: { user_id: user.id }, // Filtra por el usuario autenticado
    attributes: ['id', 'status', 'notes', 'createdAt', 'availability_id', 'service_type_id'],
    include: [
      {
        model: Availability,
        as: "availability",
        attributes: ['id', 'date', 'start_time', 'end_time'],
        include: [{ model: User, as: "dentist", attributes: ["id", "name"] }], // Incluye el dentista
      },
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ['id', 'name', 'description', 'duration', 'is_active', 'specialty_id'],
        include: [{ model: Specialty, as: "specialty", attributes: ["name", 'id', 'description', 'is_active'] }], // Incluye la especialidad del servicio
      },
    ],
    order: [["createdAt", "DESC"]], // Ordena por creación descendente (más recientes primero)
    limit: parseInt(limit), // Asegura que `limit` sea número
    offset: parseInt(offset), // Asegura que `offset` sea número
  });

  return {
    appointments: AppointmentOutputDto.fromList(rows), // Mapea las citas al DTO de salida
    pagination: {
      totalItems: count, // Total de registros
      totalPages: Math.ceil(count / limit), // Total de páginas
      currentPage: parseInt(page), // Página actual como número
      limit: parseInt(limit), // Límite por página como número
    },
  };
}

/**
 * Actualiza el estado de una cita específica.
 * - Valida el cuerpo recibido con el DTO correspondiente.
 * - Verifica que la cita exista antes de actualizarla.
 * - Devuelve la cita actualizada en formato de salida.
 * @param {number} appointmentId - ID de la cita a actualizar.
 * @param {object} statusData - Datos con el nuevo estado de la cita.
 * @returns {Promise<AppointmentOutputDto>} La cita actualizada.
 */
async function updateStatus(appointmentId, statusData) {
  const { error, value } = updateAppointmentStatusDto.validate(statusData); // Valida la entrada
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const appointment = await Appointment.findByPk(appointmentId); // Busca la cita por ID
  if (!appointment) {
    throw createHttpError(404, "Appointment not found"); // Si no existe, error 404
  }

  await appointment.update({ status: value.status }); // Actualiza el estado

  const fullAppointment = await findFullAppointmentById(appointmentId); // Obtiene la versión completa
  return new AppointmentOutputDto(fullAppointment); // Devuelve DTO de salida
}

// Exporta las funciones del servicio para ser usadas en controladores u otros módulos
module.exports = {
  create,
  getMyAppointments,
  updateStatus,
};
