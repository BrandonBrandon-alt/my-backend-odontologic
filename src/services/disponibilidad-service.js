const { Disponibilidad, User, Especialidad, Appointment } = require('../models');
const { Op } = require('sequelize');
const DisponibilidadOutputDto = require('../dtos/disponibilidad-dto');

async function getAll() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentTimeStr = now.toTimeString().slice(0, 8);
  const disponibilidades = await Disponibilidad.findAll({
    where: {
      is_active: true,
      [Op.or]: [
        { date: { [Op.gt]: todayStr } },
        { date: todayStr, start_time: { [Op.gt]: currentTimeStr } }
      ]
    },
    include: [
      { model: User, as: 'dentist', where: { status: 'active' }, attributes: ['id', 'name'] },
      { model: Especialidad, as: 'especialidad', where: { is_active: true }, attributes: ['id', 'name'] }
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']]
  });
  return DisponibilidadOutputDto.fromList(disponibilidades);
}

async function getByEspecialidad(especialidad_id, date) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentTimeStr = now.toTimeString().slice(0, 8);
  const whereClause = { especialidad_id, is_active: true };
  if (date) {
    whereClause.date = date;
  } else {
    whereClause[Op.or] = [
      { date: { [Op.gt]: todayStr } },
      { date: todayStr, start_time: { [Op.gt]: currentTimeStr } }
    ];
  }
  const disponibilidades = await Disponibilidad.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'dentist', where: { status: 'active' }, attributes: ['id', 'name'] },
      { model: Especialidad, as: 'especialidad', where: { is_active: true }, attributes: ['id', 'name'] }
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']]
  });
  return DisponibilidadOutputDto.fromList(disponibilidades);
}

async function getByDentist(dentist_id, date) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentTimeStr = now.toTimeString().slice(0, 8);
  const whereClause = { dentist_id, is_active: true };
  if (date) {
    whereClause.date = date;
  } else {
    whereClause[Op.or] = [
      { date: { [Op.gt]: todayStr } },
      { date: todayStr, start_time: { [Op.gt]: currentTimeStr } }
    ];
  }
  const disponibilidades = await Disponibilidad.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'dentist', where: { status: 'active' }, attributes: ['id', 'name'] },
      { model: Especialidad, as: 'especialidad', where: { is_active: true }, attributes: ['id', 'name'] }
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']]
  });
  return DisponibilidadOutputDto.fromList(disponibilidades);
}

async function getById(id) {
  const disponibilidad = await Disponibilidad.findOne({
    where: { id, is_active: true },
    include: [
      { model: User, as: 'dentist', where: { status: 'active' }, attributes: ['id', 'name'] },
      { model: Especialidad, as: 'especialidad', where: { is_active: true }, attributes: ['id', 'name'] }
    ]
  });
  if (!disponibilidad) {
    const err = new Error('Disponibilidad no encontrada');
    err.status = 404;
    throw err;
  }
  return new DisponibilidadOutputDto(disponibilidad);
}

async function create({ dentist_id, especialidad_id, date, start_time, end_time }) {
  // Validaciones básicas
  if (!dentist_id) throw Object.assign(new Error('El dentista es requerido'), { status: 400 });
  if (!especialidad_id) throw Object.assign(new Error('La especialidad es requerida'), { status: 400 });
  if (!date) throw Object.assign(new Error('La fecha es requerida'), { status: 400 });
  if (!start_time || !end_time) throw Object.assign(new Error('La hora de inicio y fin son requeridas'), { status: 400 });
  if (start_time >= end_time) throw Object.assign(new Error('La hora de inicio debe ser menor que la hora de fin'), { status: 400 });
  // Verificar que la fecha no sea en el pasado
  const disponibilidadDate = new Date(date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (disponibilidadDate < today) throw Object.assign(new Error('No se puede crear disponibilidad para fechas pasadas'), { status: 400 });
  // Verificar que el dentista existe y es un dentista
  const dentist = await User.findOne({ where: { id: dentist_id, role: 'dentist', status: 'active' } });
  if (!dentist) throw Object.assign(new Error('Dentista no encontrado'), { status: 404 });
  // Verificar que la especialidad existe
  const especialidad = await Especialidad.findOne({ where: { id: especialidad_id, is_active: true } });
  if (!especialidad) throw Object.assign(new Error('Especialidad no encontrada'), { status: 404 });
  // Verificar que no hay conflicto de horarios para el mismo dentista en la misma fecha
  const conflictingDisponibilidad = await Disponibilidad.findOne({
    where: {
      dentist_id,
      date,
      is_active: true,
      [Op.or]: [
        { start_time: { [Op.lt]: end_time }, end_time: { [Op.gt]: start_time } }
      ]
    }
  });
  if (conflictingDisponibilidad) throw Object.assign(new Error('Ya existe una disponibilidad que se superpone con este horario'), { status: 409 });
  // Crear la disponibilidad
  const disponibilidad = await Disponibilidad.create({ dentist_id, especialidad_id, date, start_time, end_time, is_active: true });
  const fullDisponibilidad = await Disponibilidad.findByPk(disponibilidad.id, {
    include: [
      { model: User, as: 'dentist', attributes: ['id', 'name'] },
      { model: Especialidad, as: 'especialidad', attributes: ['id', 'name'] }
    ]
  });
  return { success: true, message: 'Disponibilidad creada exitosamente', data: new DisponibilidadOutputDto(fullDisponibilidad) };
}

async function update(id, { dentist_id, especialidad_id, date, start_time, end_time }) {
  if (!dentist_id) throw Object.assign(new Error('El dentista es requerido'), { status: 400 });
  if (!especialidad_id) throw Object.assign(new Error('La especialidad es requerida'), { status: 400 });
  if (!date) throw Object.assign(new Error('La fecha es requerida'), { status: 400 });
  if (!start_time || !end_time) throw Object.assign(new Error('La hora de inicio y fin son requeridas'), { status: 400 });
  if (start_time >= end_time) throw Object.assign(new Error('La hora de inicio debe ser menor que la hora de fin'), { status: 400 });
  const disponibilidad = await Disponibilidad.findOne({ where: { id, is_active: true } });
  if (!disponibilidad) throw Object.assign(new Error('Disponibilidad no encontrada'), { status: 404 });
  const dentist = await User.findOne({ where: { id: dentist_id, role: 'dentist', status: 'active' } });
  if (!dentist) throw Object.assign(new Error('Dentista no encontrado'), { status: 404 });
  const especialidad = await Especialidad.findOne({ where: { id: especialidad_id, is_active: true } });
  if (!especialidad) throw Object.assign(new Error('Especialidad no encontrada'), { status: 404 });
  const conflictingDisponibilidad = await Disponibilidad.findOne({
    where: {
      dentist_id,
      date,
      is_active: true,
      id: { [Op.ne]: id },
      [Op.or]: [
        { start_time: { [Op.lt]: end_time }, end_time: { [Op.gt]: start_time } }
      ]
    }
  });
  if (conflictingDisponibilidad) throw Object.assign(new Error('Ya existe una disponibilidad que se superpone con este horario'), { status: 409 });
  await disponibilidad.update({ dentist_id, especialidad_id, date, start_time, end_time });
  const updatedDisponibilidad = await Disponibilidad.findByPk(disponibilidad.id, {
    include: [
      { model: User, as: 'dentist', attributes: ['id', 'name'] },
      { model: Especialidad, as: 'especialidad', attributes: ['id', 'name'] }
    ]
  });
  return { success: true, message: 'Disponibilidad actualizada exitosamente', data: new DisponibilidadOutputDto(updatedDisponibilidad) };
}

async function deactivate(id) {
  const disponibilidad = await Disponibilidad.findOne({ where: { id, is_active: true } });
  if (!disponibilidad) throw Object.assign(new Error('Disponibilidad no encontrada'), { status: 404 });
  const pendingAppointments = await Appointment.count({ where: { disponibilidad_id: id, status: ['pending', 'confirmed'] } });
  if (pendingAppointments > 0) throw Object.assign(new Error('No se puede desactivar la disponibilidad porque tiene citas pendientes o confirmadas'), { status: 400 });
  await disponibilidad.update({ is_active: false });
  return { success: true, message: 'Disponibilidad desactivada exitosamente', data: { id: disponibilidad.id, is_active: false } };
}

module.exports = {
  getAll,
  getByEspecialidad,
  getByDentist,
  getById,
  create,
  update,
  deactivate,
}; 