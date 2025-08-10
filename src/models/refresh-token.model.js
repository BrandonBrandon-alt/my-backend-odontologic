/**
 * Modelo RefreshToken.
 * Almacena tokens de refresco para emitir nuevos tokens de acceso, con fecha de expiración
 * y relación con el usuario propietario.
 */
// Import the Model and DataTypes classes from the sequelize library.
const { Model, DataTypes } = require('sequelize');

// Export a function that defines the model.
module.exports = (sequelize) => {
  // Define the RefreshToken model by extending the Sequelize Model class.
  class RefreshToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of the Sequelize lifecycle.
     * The `models/index.js` file will call this method automatically.
     */
    static associate(models) {
      // A RefreshToken belongs to a single User.
      RefreshToken.belongsTo(models.User, { 
        foreignKey: 'user_id', // The foreign key in the refresh_tokens table.
        as: 'user'             // The alias for the association.
      });
    }
  }
  
  // Initialize the model's attributes and options.
  RefreshToken.init({
    // Defines the 'id' column, the primary key.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // The foreign key linking to the 'users' table.
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {          // Enforces database-level referential integrity.
        model: 'users',      // References the 'users' table.
        key: 'id'            // Connects to the 'id' column of the 'users' table.
      }
    },
    // The refresh token string itself. It must be unique.
    token: {
      type: DataTypes.TEXT,  // TEXT is used to accommodate very long token strings.
      allowNull: false,
      unique: true
    },
    // The exact date and time when the token expires.
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
    // 'created_at' and 'updated_at' are handled automatically by Sequelize below.
  }, {
    sequelize,                 // The Sequelize instance.
    modelName: 'RefreshToken', // The name of the model.
    tableName: 'refresh_tokens',// The name of the table in the database.
    timestamps: true,          // Enable automatic 'createdAt' and 'updatedAt' columns.
    underscored: true          // Use snake_case for column names (e.g., 'created_at' instead of 'createdAt').
  });
  
  return RefreshToken;
};