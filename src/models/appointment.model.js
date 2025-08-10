/**
 * Modelo Appointment (citas).
 * Representa una cita asociada a un usuario registrado o a un paciente invitado,
 * enlazada a un bloque de disponibilidad y a un tipo de servicio. Incluye validaciones
 * a nivel de modelo para garantizar reglas de negocio (exactamente un tipo de paciente).
 */
// Import the DataTypes object from the sequelize library.
const { DataTypes } = require("sequelize");

// Export a function that defines the model.
module.exports = (sequelize) => {
  // Definición del modelo y sus columnas con tipos y restricciones
  const Appointment = sequelize.define("Appointment", {
    // Defines the 'id' column, the primary key.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // Foreign Key to the User model for registered patients. Null if it's a guest.
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Foreign Key to the GuestPatient model for non-registered patients. Null if it's a registered user.
    guest_patient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'guest_patients',
        key: 'id'
      }
    },
    // Foreign Key to the Availability model. This links the appointment to a specific time slot.
    availability_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'availabilities', // Use the translated table name 'availabilities'
        key: 'id'
      }
    },
    // Foreign Key to the ServiceType model.
    service_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'service_types',
        key: 'id'
      }
    },
    // The status of the appointment.
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
      allowNull: false,
      defaultValue: "pending"
    },
    // Any additional notes about the appointment.
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
    // The fields 'preferred_date', 'preferred_time', and 'appointment_type' were removed
    // because they are redundant. The date/time comes from the associated 'Availability' record,
    // and the type is determined by which patient foreign key is set.
  }, {
    tableName: 'appointments',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      // Add indexes to all foreign keys and frequently queried fields.
      { fields: ['user_id'] },
      { fields: ['guest_patient_id'] },
      { fields: ['availability_id'] },
      { fields: ['service_type_id'] },
      { fields: ['status'] }
    ],
    // Validaciones a nivel de modelo para reglas de negocio
    validate: {
      // Asegura que exista exactamente un tipo de paciente asociado (usuario o invitado, no ambos)
      hasOnePatientType() {
        if ((this.user_id && this.guest_patient_id) || (!this.user_id && !this.guest_patient_id)) {
          throw new Error('Appointment must have either a user_id or a guest_patient_id, but not both.');
        }
      }
    }
  });

  return Appointment;
};