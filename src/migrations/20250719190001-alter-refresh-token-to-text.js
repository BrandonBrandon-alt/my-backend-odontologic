'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('refresh_tokens', 'token', {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('refresh_tokens', 'token', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  }
}; 