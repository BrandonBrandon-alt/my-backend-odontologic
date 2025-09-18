/**
 * Seeder para usuarios del sistema
 */

const bcrypt = require('bcrypt');
const { User, Specialty } = require('../models');

async function run() {
  try {
    // Verificar si ya existen usuarios
    const existingCount = await User.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} usuarios. Saltando seeder de usuarios.`);
      return;
    }

    // Obtener especialidades para asignar a dentistas
    const specialties = await Specialty.findAll();
    const saltRounds = 10;

    const users = [
      // Administrador
      {
        name: 'Administrador Sistema',
        id_number: '12345678',
        email: 'admin@clinica.com',
        password: await bcrypt.hash('admin123', saltRounds),
        phone: '+57 300 123 4567',
        role: 'admin',
        status: 'active'
      },
      
      // Dentistas por especialidad
      {
        name: 'Dr. Carlos Rodríguez',
        id_number: '23456789',
        email: 'carlos.rodriguez@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 301 234 5678',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dra. María González',
        id_number: '34567890',
        email: 'maria.gonzalez@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 302 345 6789',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dr. Luis Martínez',
        id_number: '45678901',
        email: 'luis.martinez@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 303 456 7890',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dra. Ana Herrera',
        id_number: '56789012',
        email: 'ana.herrera@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 304 567 8901',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dr. Roberto Silva',
        id_number: '67890123',
        email: 'roberto.silva@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 305 678 9012',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dra. Patricia López',
        id_number: '78901234',
        email: 'patricia.lopez@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 306 789 0123',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dr. Fernando Ruiz',
        id_number: '89012345',
        email: 'fernando.ruiz@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 307 890 1234',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dra. Carmen Jiménez',
        id_number: '90123456',
        email: 'carmen.jimenez@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 308 901 2345',
        role: 'dentist',
        status: 'active'
      },
      {
        name: 'Dr. Miguel Torres',
        id_number: '01234567',
        email: 'miguel.torres@clinica.com',
        password: await bcrypt.hash('dentist123', saltRounds),
        phone: '+57 309 012 3456',
        role: 'dentist',
        status: 'active'
      },
      
      // Usuarios pacientes de prueba
      {
        name: 'Juan Pérez',
        id_number: '11111111',
        email: 'juan.perez@email.com',
        password: await bcrypt.hash('user123', saltRounds),
        phone: '+57 310 123 4567',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Laura García',
        id_number: '22222222',
        email: 'laura.garcia@email.com',
        password: await bcrypt.hash('user123', saltRounds),
        phone: '+57 311 234 5678',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Pedro Ramírez',
        id_number: '33333333',
        email: 'pedro.ramirez@email.com',
        password: await bcrypt.hash('user123', saltRounds),
        phone: '+57 312 345 6789',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Sofia Morales',
        id_number: '44444444',
        email: 'sofia.morales@email.com',
        password: await bcrypt.hash('user123', saltRounds),
        phone: '+57 313 456 7890',
        role: 'user',
        status: 'active'
      }
    ];

    // Crear usuarios
    const createdUsers = await User.bulkCreate(users, {
      returning: true,
      ignoreDuplicates: true
    });

    console.log(`✅ Creados ${createdUsers.length} usuarios:`);
    
    // Mostrar usuarios creados por rol
    const usersByRole = createdUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} usuarios`);
    });

    // Mostrar credenciales de prueba
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   Admin: admin@clinica.com / admin123');
    console.log('   Dentista: carlos.rodriguez@clinica.com / dentist123');
    console.log('   Paciente: juan.perez@email.com / user123');

  } catch (error) {
    console.error('❌ Error en seeder de usuarios:', error);
    throw error;
  }
}

module.exports = { run };
