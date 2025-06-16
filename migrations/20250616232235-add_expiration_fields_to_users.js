'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'activation_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'activation_expires_at');
    await queryInterface.removeColumn('users', 'password_reset_expires_at');
  }
};