const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Disponibilidad = sequelize.define("Disponibilidad", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    dentist_id: { // FK a User (dentista)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    especialidad_id: { // FK a Especialidad
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'especialidades',
        key: 'id'
      }
    },
    date: { // Fecha específica de la disponibilidad (YYYY-MM-DD)
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: { // Formato "HH:MM:SS"
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: { // Formato "HH:MM:SS"
      type: DataTypes.TIME,
      allowNull: false
    },
    is_active: { // Para desactivar horarios sin eliminarlos
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'disponibilidades',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['dentist_id', 'date']
      },
      {
        fields: ['especialidad_id']
      },
      {
        fields: ['is_active']
      }
    ],
    validate: {
      endTimeAfterStartTime() {
        if (this.start_time && this.end_time) {
          const start = new Date(`2000-01-01T${this.start_time}`);
          const end = new Date(`2000-01-01T${this.end_time}`);
          if (end <= start) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio');
          }
        }
      }
    }
  });

  return Disponibilidad;
}; 