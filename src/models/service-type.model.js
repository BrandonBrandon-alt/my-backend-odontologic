/**
 * Modelo ServiceType (tipos de servicio).
 * Representa procedimientos/servicios disponibles vinculados a una especialidad,
 * con duración estimada y estado activo.
 */
// Import the DataTypes object from the sequelize library.
// DataTypes is used to define the data types of the columns in the model.
const { DataTypes } = require("sequelize");

// Export a function that defines the model.
// This function will be called by Sequelize to register the model.
module.exports = (sequelize) => {
  // Define a new model named 'ServiceType'. This will create a table named 'service_types' in the database.
  const ServiceType = sequelize.define("ServiceType", {
    // Defines the 'id' column.
    id: {
      type: DataTypes.INTEGER,      // The data type is an integer.
      primaryKey: true,             // This column is the primary key of the table.
      autoIncrement: true,          // The value will automatically increase for each new record.
      allowNull: false              // This field cannot be empty.
    },
    // Defines the 'name' column for the service type.
    name: {
      type: DataTypes.STRING,       // The data type is a string.
      allowNull: false,             // This field cannot be empty.
      unique: true                  // Each service type must have a unique name.
    },
    // Defines the 'description' column.
    description: {
      type: DataTypes.TEXT,         // The data type is TEXT for longer descriptions.
      allowNull: true               // This field can be empty.
    },
    // Defines the 'specialty_id' column.
    specialty_id: {
      type: DataTypes.INTEGER,      // The data type is an integer.
      allowNull: false,             // This field cannot be empty.
      references: {                 // This sets up the foreign key relationship.
        model: 'specialties',       // It references the 'specialties' table.
        key: 'id'                   // It connects to the 'id' column of the 'specialties' table.
      }
    },
    // Defines the 'duration' of the service in minutes.
    duration: {
      type: DataTypes.INTEGER,      // The data type is an integer.
      allowNull: true,              // This field can be empty.
      validate: {                   // Validation rules for the duration.
        min: 1,                     // Minimum duration is 1 minute.
        max: 480                    // Maximum duration is 480 minutes (8 hours).
      }
    },
    // Defines whether the service type is active or not.
    is_active: {
      type: DataTypes.BOOLEAN,      // The data type is a boolean (true or false).
      allowNull: false,             // This field cannot be empty.
      defaultValue: true            // If no value is provided, it will default to 'true'.
    }
  }, {
    // Model options
    tableName: 'service_types',     // Explicitly sets the table name in the database.
    freezeTableName: true,          // Prevents Sequelize from pluralizing the model name to create the table name.
    timestamps: true,               // Automatically adds 'createdAt' and 'updatedAt' columns.
    indexes: [                      // Defines database indexes to improve query performance.
      { fields: ['specialty_id'] }, // Creates an index on the 'specialty_id' column for faster lookups.
      { fields: ['is_active'] }     // Creates an index on the 'is_active' column to speed up filtering.
    ]
  });

  return ServiceType;
};