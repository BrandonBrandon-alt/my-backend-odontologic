'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appointments', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      guest_patient_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'guest_patients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      availability_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'availabilities', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      service_type_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_types', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      status: { type: Sequelize.ENUM("pending", "confirmed", "cancelled", "completed"), allowNull: false, defaultValue: "pending" },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('appointments');
  }
};