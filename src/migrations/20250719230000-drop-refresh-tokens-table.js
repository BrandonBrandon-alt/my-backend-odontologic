'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la tabla existe antes de eliminarla
    const tables = await queryInterface.showAllTables();
    if (tables.includes('refresh_tokens')) {
      await queryInterface.dropTable('refresh_tokens');
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Recrear la tabla si es necesario hacer rollback
    await queryInterface.createTable('refresh_tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  }
}; 