// specialty.model.js

// Import the DataTypes object from the sequelize library.
const { DataTypes } = require("sequelize");

// Export a function that defines the model.
module.exports = (sequelize) => {
  // Define the 'Specialty' model for different dental specialties.
  const Specialty = sequelize.define("Specialty", {
    // Defines the 'id' column, the primary key.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // The name of the specialty (e.g., "Orthodontics", "Endodontics").
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // A detailed description of the specialty.
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // A flag to activate or deactivate a specialty without deleting it.
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    // Model options
    tableName: 'specialties',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      { fields: ['is_active'] } // Index for quickly filtering by active status.
    ]
  });

  return Specialty;
};