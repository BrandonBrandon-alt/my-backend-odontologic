// Import the DataTypes object from the sequelize library.
const { DataTypes } = require("sequelize");

// Export a function that defines the model.
module.exports = (sequelize) => {
  // Define the 'Availability' model to store a dentist's work schedule.
  const Availability = sequelize.define("Availability", {
    // Defines the 'id' column, the primary key.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // Foreign Key to the User model (specifically for users with the 'dentist' role).
    dentist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Foreign Key to the Specialty model.
    specialty_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'specialties', // Assumes the specialties table is named 'specialties'
        key: 'id'
      }
    },
    // The specific date of availability (format: YYYY-MM-DD).
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // The start time of the availability slot (format: HH:MM:SS).
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    // The end time of the availability slot (format: HH:MM:SS).
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    // A flag to deactivate a schedule without deleting it (soft delete).
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    // Model options
    tableName: 'availabilities',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      // A compound index to quickly find all availabilities for a specific dentist on a given date.
      {
        fields: ['dentist_id', 'date']
      },
      // Index to speed up queries filtering by specialty.
      {
        fields: ['specialty_id']
      },
      // Index to speed up queries filtering by active status.
      {
        fields: ['is_active']
      }
    ],
    // Custom model-level validations.
    validate: {
      // Ensures that the end_time is always after the start_time.
      endTimeAfterStartTime() {
        if (this.start_time && this.end_time) {
          // A simple string comparison works for "HH:MM:SS" format.
          if (this.end_time <= this.start_time) {
            throw new Error('End time must be after the start time');
          }
        }
      }
    }
  });

  return Availability;
};