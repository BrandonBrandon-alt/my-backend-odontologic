const { ServiceType, Especialidad } = require('../models');
const ServiceTypeOutputDto = require('../dtos/serviceType-dto');

async function getAll() {
  const serviceTypes = await ServiceType.findAll({
    where: { is_active: true },
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        where: { is_active: true },
        attributes: ['id', 'name', 'description', 'is_active']
      }
    ],
    order: [['name', 'ASC']]
  });
  return ServiceTypeOutputDto.fromList(serviceTypes);
}

async function getByEspecialidad(especialidad_id) {
  const serviceTypes = await ServiceType.findAll({
    where: { especialidad_id, is_active: true },
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        where: { is_active: true },
        attributes: ['id', 'name', 'description', 'is_active']
      }
    ],
    order: [['name', 'ASC']]
  });
  return ServiceTypeOutputDto.fromList(serviceTypes);
}

async function getById(id) {
  const serviceType = await ServiceType.findOne({
    where: { id, is_active: true },
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        where: { is_active: true },
        attributes: ['id', 'name', 'description', 'is_active']
      }
    ]
  });
  if (!serviceType) {
    const err = new Error('Tipo de servicio no encontrado');
    err.status = 404;
    throw err;
  }
  return new ServiceTypeOutputDto(serviceType);
}

async function create({ name, description, duration, especialidad_id }) {
  if (!name || name.trim().length < 2) {
    const err = new Error('El nombre del servicio es requerido y debe tener al menos 2 caracteres');
    err.status = 400;
    throw err;
  }
  if (!duration || duration < 15) {
    const err = new Error('La duración es requerida y debe ser al menos 15 minutos');
    err.status = 400;
    throw err;
  }
  if (!especialidad_id) {
    const err = new Error('La especialidad es requerida');
    err.status = 400;
    throw err;
  }
  const especialidad = await Especialidad.findOne({ where: { id: especialidad_id, is_active: true } });
  if (!especialidad) {
    const err = new Error('Especialidad no encontrada');
    err.status = 404;
    throw err;
  }
  const existingServiceType = await ServiceType.findOne({
    where: { name: name.trim(), especialidad_id, is_active: true }
  });
  if (existingServiceType) {
    const err = new Error('Ya existe un servicio con este nombre en esta especialidad');
    err.status = 409;
    throw err;
  }
  const serviceType = await ServiceType.create({
    name: name.trim(),
    description: description || null,
    duration: parseInt(duration),
    especialidad_id,
    is_active: true
  });
  const fullServiceType = await ServiceType.findByPk(serviceType.id, {
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        attributes: ['id', 'name', 'description', 'is_active']
      }
    ]
  });
  return {
    success: true,
    message: 'Tipo de servicio creado exitosamente',
    data: new ServiceTypeOutputDto(fullServiceType)
  };
}

async function update(id, { name, description, duration, especialidad_id }) {
  if (!name || name.trim().length < 2) {
    const err = new Error('El nombre del servicio es requerido y debe tener al menos 2 caracteres');
    err.status = 400;
    throw err;
  }
  if (!duration || duration < 15) {
    const err = new Error('La duración es requerida y debe ser al menos 15 minutos');
    err.status = 400;
    throw err;
  }
  if (!especialidad_id) {
    const err = new Error('La especialidad es requerida');
    err.status = 400;
    throw err;
  }
  const serviceType = await ServiceType.findOne({ where: { id, is_active: true } });
  if (!serviceType) {
    const err = new Error('Tipo de servicio no encontrado');
    err.status = 404;
    throw err;
  }
  const especialidad = await Especialidad.findOne({ where: { id: especialidad_id, is_active: true } });
  if (!especialidad) {
    const err = new Error('Especialidad no encontrada');
    err.status = 404;
    throw err;
  }
  if (name.trim() !== serviceType.name || especialidad_id !== serviceType.especialidad_id) {
    const existingServiceType = await ServiceType.findOne({
      where: { name: name.trim(), especialidad_id, is_active: true }
    });
    if (existingServiceType && existingServiceType.id !== serviceType.id) {
      const err = new Error('Ya existe un servicio con este nombre en esta especialidad');
      err.status = 409;
      throw err;
    }
  }
  await serviceType.update({
    name: name.trim(),
    description: description || null,
    duration: parseInt(duration),
    especialidad_id
  });
  const updatedServiceType = await ServiceType.findByPk(serviceType.id, {
    include: [
      {
        model: Especialidad,
        as: 'especialidad',
        attributes: ['id', 'name', 'description', 'is_active']
      }
    ]
  });
  return {
    success: true,
    message: 'Tipo de servicio actualizado exitosamente',
    data: new ServiceTypeOutputDto(updatedServiceType)
  };
}

async function deactivate(id) {
  const serviceType = await ServiceType.findOne({ where: { id, is_active: true } });
  if (!serviceType) {
    const err = new Error('Tipo de servicio no encontrado');
    err.status = 404;
    throw err;
  }
  await serviceType.update({ is_active: false });
  return {
    success: true,
    message: 'Tipo de servicio desactivado exitosamente',
    data: { id: serviceType.id, is_active: false }
  };
}

module.exports = {
  getAll,
  getByEspecialidad,
  getById,
  create,
  update,
  deactivate,
}; 