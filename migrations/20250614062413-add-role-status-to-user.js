'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('user', 'dentist', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    });
    await queryInterface.addColumn('Users', 'status', {
      type: Sequelize.ENUM('active', 'locked', 'inactive'),
      allowNull: false,
      defaultValue: 'inactive'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'role');
    await queryInterface.removeColumn('Users', 'status');
  }
};
