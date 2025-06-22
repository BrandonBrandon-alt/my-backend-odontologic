'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Dr. María González',
        id_number: '12345678',
        email: 'maria.gonzalez@clinica.com',
        password: hashedPassword,
        phone: '3001234567',
        address: 'Calle 123 #45-67, Bogotá',
        birth_date: '1985-03-15',
        role: 'dentist',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dr. Carlos Rodríguez',
        id_number: '87654321',
        email: 'carlos.rodriguez@clinica.com',
        password: hashedPassword,
        phone: '3009876543',
        address: 'Carrera 78 #90-12, Medellín',
        birth_date: '1980-07-22',
        role: 'dentist',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dra. Ana Martínez',
        id_number: '11223344',
        email: 'ana.martinez@clinica.com',
        password: hashedPassword,
        phone: '3005556666',
        address: 'Avenida 5 #23-45, Cali',
        birth_date: '1988-11-08',
        role: 'dentist',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dr. Luis Pérez',
        id_number: '55667788',
        email: 'luis.perez@clinica.com',
        password: hashedPassword,
        phone: '3007778888',
        address: 'Calle 10 #15-20, Barranquilla',
        birth_date: '1982-04-30',
        role: 'dentist',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Administrador Sistema',
        id_number: '99999999',
        email: 'admin@clinica.com',
        password: hashedPassword,
        phone: '3000000000',
        address: 'Oficina Principal',
        birth_date: '1990-01-01',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Juan Pérez',
        id_number: '11111111',
        email: 'juan.perez@email.com',
        password: hashedPassword,
        phone: '3001111111',
        address: 'Calle 1 #1-1, Bogotá',
        birth_date: '1995-05-15',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'María López',
        id_number: '22222222',
        email: 'maria.lopez@email.com',
        password: hashedPassword,
        phone: '3002222222',
        address: 'Calle 2 #2-2, Medellín',
        birth_date: '1992-08-20',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
