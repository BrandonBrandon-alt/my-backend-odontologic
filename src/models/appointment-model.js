const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Appointment = sequelize.define("Appointment", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: { // FK a User (para pacientes registrados)
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    guest_patient_id: { // FK a GuestPatient (para pacientes invitados)
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'guest_patients',
        key: 'id'
      }
    },
    disponibilidad_id: { // FK a Disponibilidad
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'disponibilidades',
        key: 'id'
      }
    },
    service_type_id: { // FK a ServiceType
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'service_types',
        key: 'id'
      }
    },
    preferred_date: { // Fecha preferida de la cita (YYYY-MM-DD)
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    preferred_time: { // Hora preferida de la cita (HH:MM:SS)
      type: DataTypes.TIME,
      allowNull: true
    },
    status: { // Estado de la cita: "pending", "confirmed", "cancelled", "completed"
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
      allowNull: false,
      defaultValue: "pending"
    },
    appointment_type: { // Tipo de cita: "guest" o "registered"
      type: DataTypes.ENUM("guest", "registered"),
      allowNull: false
    },
    notes: { // Notas sobre la cita
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'appointments',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['guest_patient_id']
      },
      {
        fields: ['disponibilidad_id']
      },
      {
        fields: ['service_type_id']
      },
      {
        fields: ['preferred_date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['appointment_type']
      }
    ]
  });

  return Appointment;
}; 