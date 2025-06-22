const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Disponibilidad = sequelize.define("Disponibilidad", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    day_of_week: {
      type: DataTypes.INTEGER, // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo
      allowNull: false,
      validate: {
        min: 1,
        max: 7
      }
    },
    start_time: { // Formato "HH:MM"
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validación formato HH:MM
      }
    },
    end_time: { // Formato "HH:MM"
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validación formato HH:MM
      }
    },
    is_active: { // Para desactivar horarios sin eliminarlos
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // dentistId (FK) se agregará en las asociaciones
  }, {
    tableName: 'disponibilidades',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['dentistId', 'day_of_week']
      },
      {
        fields: ['is_active']
      }
    ],
    validate: {
      endTimeAfterStartTime() {
        if (this.start_time && this.end_time) {
          const start = new Date(`2000-01-01T${this.start_time}:00`);
          const end = new Date(`2000-01-01T${this.end_time}:00`);
          if (end <= start) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio');
          }
        }
      }
    }
  });

  return Disponibilidad;
}; 