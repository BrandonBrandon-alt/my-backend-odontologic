'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('DentistSpecialties', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dentist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      especialidad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'especialidades',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('DentistSpecialties', ['dentist_id']);
    await queryInterface.addIndex('DentistSpecialties', ['especialidad_id']);
    await queryInterface.addIndex('DentistSpecialties', ['dentist_id', 'especialidad_id'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DentistSpecialties');
  }
};
