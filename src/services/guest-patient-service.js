const { GuestPatient } = require('../models');
const createGuestPatientSchema = require('../dtos/create-guest-patient-dto');
const { Op } = require('sequelize');

async function create(body) {
  const { error, value } = createGuestPatientSchema.validate(body);
  if (error) {
    const err = new Error('Datos de entrada inválidos');
    err.status = 400;
    err.errors = error.details.map(detail => detail.message);
    throw err;
  }
  if (value.email) {
    const existingPatient = await GuestPatient.findOne({ where: { email: value.email, is_active: true } });
    if (existingPatient) {
      const err = new Error('Ya existe un paciente con este email');
      err.status = 409;
      throw err;
    }
  }
  const guestPatient = await GuestPatient.create({
    name: value.name,
    phone: value.phone,
    email: value.email || null,
    is_active: true
  });
  return {
    success: true,
    message: 'Paciente invitado creado exitosamente',
    data: {
      id: guestPatient.id,
      name: guestPatient.name,
      phone: guestPatient.phone,
      email: guestPatient.email
    }
  };
}

async function getById(id) {
  const guestPatient = await GuestPatient.findOne({ where: { id, is_active: true } });
  if (!guestPatient) {
    const err = new Error('Paciente invitado no encontrado');
    err.status = 404;
    throw err;
  }
  return {
    success: true,
    data: {
      id: guestPatient.id,
      name: guestPatient.name,
      phone: guestPatient.phone,
      email: guestPatient.email,
      created_at: guestPatient.createdAt
    }
  };
}

async function update(id, body) {
  const { error, value } = createGuestPatientSchema.validate(body);
  if (error) {
    const err = new Error('Datos de entrada inválidos');
    err.status = 400;
    err.errors = error.details.map(detail => detail.message);
    throw err;
  }
  const guestPatient = await GuestPatient.findOne({ where: { id, is_active: true } });
  if (!guestPatient) {
    const err = new Error('Paciente invitado no encontrado');
    err.status = 404;
    throw err;
  }
  if (value.email && value.email !== guestPatient.email) {
    const existingPatient = await GuestPatient.findOne({
      where: {
        email: value.email,
        is_active: true,
        id: { [Op.ne]: id }
      }
    });
    if (existingPatient) {
      const err = new Error('Ya existe otro paciente con este email');
      err.status = 409;
      throw err;
    }
  }
  await guestPatient.update({
    name: value.name,
    phone: value.phone,
    email: value.email || null
  });
  return {
    success: true,
    message: 'Paciente invitado actualizado exitosamente',
    data: {
      id: guestPatient.id,
      name: guestPatient.name,
      phone: guestPatient.phone,
      email: guestPatient.email
    }
  };
}

async function deactivate(id) {
  const guestPatient = await GuestPatient.findOne({ where: { id, is_active: true } });
  if (!guestPatient) {
    const err = new Error('Paciente invitado no encontrado');
    err.status = 404;
    throw err;
  }
  await guestPatient.update({ is_active: false });
  return {
    success: true,
    message: 'Paciente invitado desactivado exitosamente'
  };
}

module.exports = {
  create,
  getById,
  update,
  deactivate,
}; 