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
 * @param {object} [details=null] - Detalles adicionales del error.
 * @returns {Error} Error con propiedad `status` asignada.
 */
const createHttpError = (status, message, details = null) => {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
};

/**
 * Valida que una fecha/hora de cita no esté en el pasado.
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} startTime - Hora en formato HH:MM:SS
 * @returns {boolean} True si la fecha es válida (futura)
 */
const isValidAppointmentDateTime = (date, startTime) => {
  const appointmentDateTime = new Date(`${date}T${startTime}`);
  const now = new Date();
  return appointmentDateTime > now;
};

/**
 * Normaliza los datos de entrada para invitados.
 * @param {object} data - Datos del invitado
 * @returns {object} Datos normalizados
 */
const normalizeGuestData = (data) => ({
  name: data.name?.trim(),
  email: data.email?.toLowerCase().trim(),
  phone: data.phone?.trim(),
  notes: data.notes?.trim() || null,
});

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
 * - Previene conflictos de horarios verificando citas existentes.
 * - Si es invitado, crea o reutiliza un registro de `GuestPatient` por email.
 * - Crea la cita dentro de una transacción para asegurar consistencia.
 * @param {object} appointmentData - Datos de la nueva cita.
 * @param {object} [user=null] - Usuario autenticado (si existe). Si es null, se considera invitado.
 * @returns {Promise<AppointmentOutputDto>} La cita creada en formato de salida.
 */
async function create(appointmentData, user = null) {
  const isGuest = !user; // Determina si la creación es para un invitado (no autenticado)
  const schema = isGuest ? createGuestAppointmentDto : createUserAppointmentDto; // Selecciona el esquema de validación adecuado

  // 🔍 PASO 1: Validación de entrada con DTO
  const { error, value } = schema.validate(appointmentData); // Valida los datos de entrada
  if (error) {
    // Si la validación falla, se lanza un error 400 con el detalle
    throw createHttpError(400, `Validation error: ${error.details[0].message}`);
  }

  // 🔍 PASO 2: Validaciones de reglas de negocio
  
  // Verifica que la disponibilidad existe, está activa y no está en el pasado
  const availability = await Availability.findOne({
    where: { id: value.availability_id, is_active: true },
    attributes: ['id', 'date', 'start_time', 'end_time'],
  });
  
  if (!availability) {
    throw createHttpError(
      404,
      "The selected availability slot was not found or is not active."
    );
  }

  // Validación adicional: verificar que la fecha no sea en el pasado
  if (!isValidAppointmentDateTime(availability.date, availability.start_time)) {
    throw createHttpError(
      400,
      "Cannot book appointments in the past. Please select a future date and time.",
      { 
        appointmentDate: availability.date, 
        appointmentTime: availability.start_time 
      }
    );
  }

  // Verifica que el tipo de servicio existe y está activo
  const serviceType = await ServiceType.findOne({
    where: { id: value.service_type_id, is_active: true },
    attributes: ['id', 'name', 'duration'],
  });
  
  if (!serviceType) {
    throw createHttpError(
      404,
      "The selected service type was not found or is not active."
    );
  }

  // 🔍 PASO 3: Verificar conflictos de horarios
  const existingAppointment = await Appointment.findOne({
    where: {
      availability_id: value.availability_id,
      status: ['pending', 'confirmed'] // Solo considerar citas activas
    },
    attributes: ['id']
  });

  if (existingAppointment) {
    throw createHttpError(
      409, // Conflict
      "This time slot is already booked. Please select a different time."
    );
  }

  // 🔍 PASO 4: Para usuarios registrados, verificar límite de citas pendientes
  if (!isGuest) {
    const pendingAppointmentsCount = await Appointment.count({
      where: {
        user_id: user.id,
        status: 'pending'
      }
    });

    const MAX_PENDING_APPOINTMENTS = 3; // Configurable
    if (pendingAppointmentsCount >= MAX_PENDING_APPOINTMENTS) {
      throw createHttpError(
        429, // Too Many Requests
        `You have reached the maximum limit of ${MAX_PENDING_APPOINTMENTS} pending appointments. Please wait for confirmation or cancel existing appointments.`
      );
    }
  }

  // 🔄 PASO 5: Transacción atómica para crear la cita
  const result = await sequelize.transaction(async (t) => {
    let guestPatientId = null; // ID del paciente invitado, si corresponde

    if (isGuest) {
      // Para invitados: normalizar datos y buscar/crear registro
      const normalizedData = normalizeGuestData(value);
      
      const [guest, created] = await GuestPatient.findOrCreate({
        where: { email: normalizedData.email },
        defaults: normalizedData,
        transaction: t,
      });
      
      guestPatientId = guest.id;
      
      // Si el invitado ya existía, actualizar información si es necesaria
      if (!created && (guest.name !== normalizedData.name || guest.phone !== normalizedData.phone)) {
        await guest.update({
          name: normalizedData.name,
          phone: normalizedData.phone,
        }, { transaction: t });
      }
    }

    // Crear la cita con estado inicial "pending"
    const newAppointment = await Appointment.create(
      {
        user_id: isGuest ? null : user.id,
        guest_patient_id: guestPatientId,
        availability_id: value.availability_id,
        service_type_id: value.service_type_id,
        notes: value.notes?.trim() || null,
        status: "pending",
      },
      { transaction: t }
    );

    // Opcional: Marcar la disponibilidad como reservada
    // await availability.update({ is_reserved: true }, { transaction: t });

    return newAppointment;
  });

  // 📤 PASO 6: Recuperar y devolver la cita completa
  const fullAppointment = await findFullAppointmentById(result.id);
  
  // Opcional: Aquí podrías agregar lógica para enviar notificaciones
   await sendAppointmentConfirmationEmail(fullAppointment);
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
