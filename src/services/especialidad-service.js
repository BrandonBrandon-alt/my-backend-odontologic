const { Especialidad } = require('../models');
const EspecialidadOutputDto = require('../dtos/especialidad-dto');

async function getAll() {
  const especialidades = await Especialidad.findAll({
    where: { is_active: true },
    order: [['name', 'ASC']]
  });
  return EspecialidadOutputDto.fromList(especialidades);
}

async function getById(id) {
  const especialidad = await Especialidad.findOne({
    where: { id, is_active: true }
  });
  if (!especialidad) {
    const err = new Error('Especialidad no encontrada');
    err.status = 404;
    throw err;
  }
  return new EspecialidadOutputDto(especialidad);
}

async function create({ name, description }) {
  if (!name || name.trim().length < 2) {
    const err = new Error('El nombre de la especialidad es requerido y debe tener al menos 2 caracteres');
    err.status = 400;
    throw err;
  }
  const existingEspecialidad = await Especialidad.findOne({
    where: { name: name.trim(), is_active: true }
  });
  if (existingEspecialidad) {
    const err = new Error('Ya existe una especialidad con este nombre');
    err.status = 409;
    throw err;
  }
  const especialidad = await Especialidad.create({
    name: name.trim(),
    description: description || null,
    is_active: true
  });
  return {
    success: true,
    message: 'Especialidad creada exitosamente',
    data: new EspecialidadOutputDto(especialidad)
  };
}

async function update(id, { name, description }) {
  if (!name || name.trim().length < 2) {
    const err = new Error('El nombre de la especialidad es requerido y debe tener al menos 2 caracteres');
    err.status = 400;
    throw err;
  }
  const especialidad = await Especialidad.findOne({ where: { id, is_active: true } });
  if (!especialidad) {
    const err = new Error('Especialidad no encontrada');
    err.status = 404;
    throw err;
  }
  if (name.trim() !== especialidad.name) {
    const existingEspecialidad = await Especialidad.findOne({ where: { name: name.trim(), is_active: true } });
    if (existingEspecialidad) {
      const err = new Error('Ya existe otra especialidad con este nombre');
      err.status = 409;
      throw err;
    }
  }
  const updatedEspecialidad = await especialidad.update({
    name: name.trim(),
    description: description || null
  });
  return {
    success: true,
    message: 'Especialidad actualizada exitosamente',
    data: new EspecialidadOutputDto(updatedEspecialidad)
  };
}

async function deactivate(id) {
  const especialidad = await Especialidad.findOne({ where: { id, is_active: true } });
  if (!especialidad) {
    const err = new Error('Especialidad no encontrada');
    err.status = 404;
    throw err;
  }
  await especialidad.update({ is_active: false });
  return {
    success: true,
    message: 'Especialidad desactivada exitosamente',
    data: { id: especialidad.id, is_active: false }
  };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deactivate,
}; 