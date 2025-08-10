/**
 * Modelo GuestPatient (pacientes invitados).
 * Representa pacientes no registrados que pueden agendar citas sin crear una cuenta.
 */
// Import the DataTypes object from the sequelize library.
const { DataTypes } = require("sequelize");

// Export a function that defines the model.
module.exports = (sequelize) => {
  // Define the 'GuestPatient' model for patients who are not registered users.
  const GuestPatient = sequelize.define("GuestPatient", {
    // Defines the 'id' column, the primary key.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // The full name of the guest patient.
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // The contact phone number for the guest patient.
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // The email address of the guest patient.
    email: {
      type: DataTypes.STRING,
      allowNull: true,     // This field can be null if an email is not provided.
      unique: true,        // Ensures that if an email is provided, it must be unique.
      validate: {
        isEmail: true      // Validates that the string is in a valid email format.
      }
    },
    // A flag to deactivate patients without deleting their records (soft delete).
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true   // Patients are active by default when created.
    }
  }, {
    // Model options
    tableName: 'guest_patients',  // Explicitly sets the table name.
    freezeTableName: true,      // Prevents Sequelize from pluralizing the model name.
    timestamps: true,           // Automatically adds 'createdAt' and 'updatedAt' columns.
    indexes: [                  // Defines database indexes for faster queries.
      {
        fields: ['email']       // Index on email to speed up lookups.
      },
      {
        fields: ['is_active']   // Index on is_active to quickly filter by status.
      }
    ]
  });

  return GuestPatient;
};