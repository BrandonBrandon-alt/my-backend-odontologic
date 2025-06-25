'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Puede ser null si es un paciente invitado
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      guest_patient_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Puede ser null si es un usuario registrado
        references: {
          model: 'guest_patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      disponibilidad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'disponibilidades',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'service_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      preferred_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      preferred_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      appointment_type: {
        type: Sequelize.ENUM('registered', 'guest'),
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Crear índices
    await queryInterface.addIndex('appointments', ['user_id']);
    await queryInterface.addIndex('appointments', ['guest_patient_id']);
    await queryInterface.addIndex('appointments', ['disponibilidad_id']);
    await queryInterface.addIndex('appointments', ['service_type_id']);
    await queryInterface.addIndex('appointments', ['preferred_date']);
    await queryInterface.addIndex('appointments', ['status']);
    await queryInterface.addIndex('appointments', ['appointment_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('appointments');
  }
};
