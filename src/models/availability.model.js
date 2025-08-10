/**
 * Modelo Availability (disponibilidades).
 * Representa los bloques de horario de un dentista para agendar citas,
 * incluyendo fecha, hora de inicio y fin, especialidad y estado activo.
 */
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
      // Índice compuesto para buscar rápidamente disponibilidades de un dentista en una fecha concreta
      {
        fields: ['dentist_id', 'date']
      },
      // Índice para filtrar por especialidad
      {
        fields: ['specialty_id']
      },
      // Índice para filtrar por estado activo
      {
        fields: ['is_active']
      }
    ],
    // Custom model-level validations.
    validate: {
      // Garantiza que end_time siempre sea posterior a start_time
      endTimeAfterStartTime() {
        if (this.start_time && this.end_time) {
          // La comparación de strings funciona para formato "HH:MM:SS"
          if (this.end_time <= this.start_time) {
            throw new Error('End time must be after the start time');
          }
        }
      }
    }
  });

  return Availability;
};