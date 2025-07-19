const { Appointment, GuestPatient, User, Disponibilidad, ServiceType, Especialidad } = require('../models');
const { updateAppointmentStatusSchema } = require('../dtos');

async function getAppointmentStats() {
  const totalAppointments = await Appointment.count();
  const pendingAppointments = await Appointment.count({ where: { status: 'pending' } });
  const confirmedAppointments = await Appointment.count({ where: { status: 'confirmed' } });
  const cancelledAppointments = await Appointment.count({ where: { status: 'cancelled' } });
  return {
    success: true,
    data: {
      total: totalAppointments,
      pending: pendingAppointments,
      confirmed: confirmedAppointments,
      cancelled: cancelledAppointments
    }
  };
}

async function getAllAppointments() {
  const appointments = await Appointment.findAll({
    include: [
      { model: GuestPatient, as: 'guestPatient', attributes: ['id', 'name', 'phone', 'email'] },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      { model: Disponibilidad, as: 'disponibilidad', include: [{ model: Especialidad, as: 'especialidad' }] },
      { model: ServiceType, as: 'serviceType' }
    ],
    order: [['createdAt', 'DESC']]
  });
  return { success: true, data: appointments };
}

async function getById(id) {
  const appointment = await Appointment.findByPk(id, {
    include: [
      { model: GuestPatient, as: 'guestPatient', attributes: ['id', 'name', 'phone', 'email'] },
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      { model: Disponibilidad, as: 'disponibilidad', include: [{ model: Especialidad, as: 'especialidad' }] },
      { model: ServiceType, as: 'serviceType' }
    ]
  });
  if (!appointment) {
    throw Object.assign(new Error('Cita no encontrada'), { status: 404 });
  }
  return { success: true, data: appointment };
}

async function updateStatus(id, body) {
  const { error, value } = updateAppointmentStatusSchema.validate(body);
  if (error) {
    const err = new Error('Datos de entrada inválidos');
    err.status = 400;
    err.errors = error.details.map(detail => detail.message);
    throw err;
  }
  const appointment = await Appointment.findByPk(id);
  if (!appointment) {
    const err = new Error('Cita no encontrada');
    err.status = 404;
    throw err;
  }
  await appointment.update({ status: value.status });
  return {
    success: true,
    message: 'Estado de cita actualizado exitosamente',
    data: { id: appointment.id, status: appointment.status }
  };
}

module.exports = {
  getAppointmentStats,
  getAllAppointments,
  getById,
  updateStatus,
}; 