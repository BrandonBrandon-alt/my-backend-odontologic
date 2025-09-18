/**
 * Seeder para pacientes invitados (no registrados)
 */

const { GuestPatient } = require('../models');

const guestPatients = [
  {
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@temp.com',
    phone: '+57 314 567 8901',
    is_active: true
  },
  {
    name: 'Isabella Vargas',
    email: 'isabella.vargas@temp.com',
    phone: '+57 315 678 9012',
    is_active: true
  },
  {
    name: 'Diego Castillo',
    email: 'diego.castillo@temp.com',
    phone: '+57 316 789 0123',
    is_active: true
  },
  {
    name: 'Valentina Rojas',
    email: 'valentina.rojas@temp.com',
    phone: '+57 317 890 1234',
    is_active: true
  },
  {
    name: 'Andrés Guerrero',
    email: 'andres.guerrero@temp.com',
    phone: '+57 318 901 2345',
    is_active: true
  },
  {
    name: 'Camila Sánchez',
    email: 'camila.sanchez@temp.com',
    phone: '+57 319 012 3456',
    is_active: true
  },
  {
    name: 'Sebastián Ortiz',
    email: 'sebastian.ortiz@temp.com',
    phone: '+57 320 123 4567',
    is_active: true
  },
  {
    name: 'Daniela Cruz',
    email: 'daniela.cruz@temp.com',
    phone: '+57 321 234 5678',
    is_active: true
  },
  {
    name: 'Mateo Delgado',
    email: 'mateo.delgado@temp.com',
    phone: '+57 322 345 6789',
    is_active: true
  },
  {
    name: 'Salome Rivera',
    email: 'salome.rivera@temp.com',
    phone: '+57 323 456 7890',
    is_active: true
  }
];

async function run() {
  try {
    // Verificar si ya existen pacientes invitados
    const existingCount = await GuestPatient.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} pacientes invitados. Saltando seeder.`);
      return;
    }

    // Crear pacientes invitados
    const createdPatients = await GuestPatient.bulkCreate(guestPatients, {
      returning: true,
      ignoreDuplicates: true
    });

    console.log(`✅ Creados ${createdPatients.length} pacientes invitados`);
    
    // Mostrar algunos ejemplos
    createdPatients.slice(0, 3).forEach(patient => {
      console.log(`   - ${patient.name} (${patient.email})`);
    });
    
    if (createdPatients.length > 3) {
      console.log(`   - ... y ${createdPatients.length - 3} más`);
    }

  } catch (error) {
    console.error('❌ Error en seeder de pacientes invitados:', error);
    throw error;
  }
}

module.exports = { run };
