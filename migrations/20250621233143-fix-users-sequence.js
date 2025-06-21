'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Corregir la secuencia de auto-incremento para la tabla users
    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No es necesario revertir esta migración ya que solo corrige la secuencia
  }
};
