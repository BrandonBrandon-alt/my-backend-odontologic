/**
 * Controlador de citas (appointments).
 * Expone endpoints para crear citas, listar las citas del usuario autenticado
 * y actualizar el estado de una cita, delegando la lógica al servicio correspondiente.
 */
const appointmentService = require("../services/appointment.service");

// A helper to wrap async functions for cleaner error handling
/**
 * Envoltorio para controladores asíncronos que captura errores y los pasa a `next`.
 * @param {Function} fn - Función asíncrona (req, res, next).
 * @returns {Function} Middleware Express que maneja errores de forma centralizada.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Maneja la creación de una nueva cita.
 * Funciona tanto para invitados como para usuarios autenticados, pasando `req.user`
 * (o null si es invitado) a la capa de servicios.
 */
const create = asyncHandler(async (req, res, next) => {
  // Llama al servicio con los datos del cuerpo y el usuario autenticado (o null si es invitado)
  const result = await appointmentService.create(req.body, req.user);
  // Responde con 201 (creado) y el resultado formateado por el DTO
  res.status(201).json(result);
});

/**
 * Obtiene todas las citas del usuario autenticado.
 * Esta ruta debe estar protegida por un middleware de autenticación.
 */
const getMyAppointments = asyncHandler(async (req, res, next) => {
  // Pasa el usuario autenticado y los parámetros de consulta para la paginación
  const result = await appointmentService.getMyAppointments(
    req.user,
    req.query
  );
  res.status(200).json(result);
});

/**
 * Actualiza el estado de una cita específica.
 * Esta ruta debería estar protegida (por ejemplo, solo admin o personal autorizado).
 */
const updateStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Obtiene el ID de la cita desde los parámetros de ruta
  const result = await appointmentService.updateStatus(id, req.body); // Pasa el nuevo estado
  res.status(200).json(result);
});

module.exports = {
  create,
  getMyAppointments,
  updateStatus,
};
