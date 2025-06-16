// migrations/YYYYMMDDHHMMSS-create-users-table.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', { // Importante: Asegúrate de que el nombre de la tabla coincida con lo que esperas.
                                                // Sequelize por defecto pluraliza y puede poner 'Users' (mayúscula) o 'users' (minúscula).
                                                // Si tu modelo tiene `freezeTableName: true` o `tableName: 'users'`, usa `users` aquí.
                                                // Si no, 'Users' o 'users' funcionarán con PostgreSQL ya que convierte a minúsculas automáticamente si no está entre comillas.
                                                // Para mayor claridad y evitar posibles problemas de case-sensitivity, te sugiero cambiar 'Users' a 'users' si lo deseas.
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false // Según tu modelo, el nombre es requerido
      },
      id_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // id_number es único
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      birth_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      profile_picture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('user', 'dentist', 'admin'), // Definición de ENUM
        allowNull: false,
        defaultValue: 'user'
      },
      status: {
        type: Sequelize.ENUM('active', 'locked', 'inactive'), // Definición de ENUM
        allowNull: false,
        defaultValue: 'inactive'
      },
      activation_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users'); // Si cambiaste arriba a 'users', cámbialo aquí también
  }
};