const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Appointment = sequelize.define("Appointment", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    date: { // Fecha de la cita (YYYY-MM-DD)
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    time: { // Hora de la cita (HH:MM)
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validación formato HH:MM
      }
    },
    status: { // Estado de la cita: "scheduled", "completed", "cancelled", "missed"
      type: DataTypes.ENUM("scheduled", "completed", "cancelled", "missed"),
      allowNull: false,
      defaultValue: "scheduled"
    },
    notes: { // Notas internas sobre la cita
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: { // Quién creó la cita
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: { // Quién actualizó la cita por última vez
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // patientId (FK de User) y guestPatientId (FK de GuestPatient) se agregarán en las asociaciones
    // serviceTypeId (FK de ServiceType) y dentistId (FK de User) también se agregarán
  }, {
    tableName: 'appointments',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['date']
      },
      {
        fields: ['dentistId', 'date']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Appointment;
}; 