const { User } = require('../models/index');
const dentistsDto = require('../dtos/dentists-dto');

// ======================= SERVICIO DE ADMINISTRADOR =======================

exports.getAllDentists = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { rows: dentists, count: total } = await User.findAndCountAll({
    where: { role: 'dentist' },
    attributes: [
      'id',
      'id_number',
      'name',
      'email',
      'phone',
      'role',
      'status'
    ],
    limit,
    offset
  });

  const validatedDentists = dentists.map(dentist => {
    const { error, value } = dentistsDto.validate(dentist.toJSON(), { stripUnknown: true });
    if (error) {
      console.warn('Registro inválido:', error.details[0].message);
      
    }
    return value;
  });

  return {
    total,               
    page,                
    totalPages: Math.ceil(total / limit),
    limit,
    data: validatedDentists
  };
};

exports.getDentist = async (id_number) => {
  const dentist = await User.findOne({
    where: { id_number, role: 'dentist' },  // 👈 Usa where correctamente
    attributes: [
      'id',
      'id_number',
      'name',
      'email',
      'phone',
      'role',
      'status'
    ]
  });

  if (!dentist) {
    throw new Error('Dentista no encontrado');
  }

  const { error, value } = dentistsDto.validate(
    dentist.toJSON(),
    { stripUnknown: true }
  );

  if (error) {
    console.warn('Registro inválido:', error.details[0].message);
    throw new Error('Datos del dentista inválidos');
  }

  return value;
};

// ======================= SERVICIO DE CLIENTES =======================

exports.getAllClients = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { rows: clients, count: total } = await User.findAndCountAll({
    where: { role: 'user' },
    attributes: [
      'id',
      'id_number',
      'name',
      'email',
      'phone',
      'role',
      'status'
    ],
    limit,
    offset
  });

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
    data: clients.map(client => client.toJSON())
  };
}

exports.getClient = async (id_number) => {
  const client = await User.findOne({   
    where: { id_number, role: 'user' },
    attributes: [
      'id',
      'id_number',
      'name',
      'email',
      'phone',
      'role',
      'status'
    ]
  });
  if (!client) {
    throw new Error('Cliente no encontrado');
  }
  return client.toJSON();
}

