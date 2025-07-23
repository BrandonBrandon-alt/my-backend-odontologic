'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: { type: Sequelize.STRING, allowNull: false },
      id_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: true },
      birth_date: { type: Sequelize.DATE, allowNull: true },
      role: { type: Sequelize.ENUM("user", "dentist", "admin"), allowNull: false, defaultValue: "user" },
      status: { type: Sequelize.ENUM("active", "locked", "inactive"), allowNull: false, defaultValue: "inactive" },
      activation_code: { type: Sequelize.STRING, allowNull: true },
      activation_expires_at: { type: Sequelize.DATE, allowNull: true },
      password_reset_code: { type: Sequelize.STRING, allowNull: true },
      password_reset_expires_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};