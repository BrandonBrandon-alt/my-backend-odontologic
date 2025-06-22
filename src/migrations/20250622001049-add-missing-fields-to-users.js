'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Agregar campos faltantes a la tabla users
    await queryInterface.addColumn('users', 'activation_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remover los campos agregados
    await queryInterface.removeColumn('users', 'activation_expires_at');
    await queryInterface.removeColumn('users', 'password_reset_expires_at');
  }
};
