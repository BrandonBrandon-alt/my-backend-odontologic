const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ServiceType = sequelize.define("ServiceType", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: { // Ej. "Consulta General", "Limpieza", "Extracción"
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    especialidad_id: { // FK a Especialidad
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'especialidades',
        key: 'id'
      }
    },
    duration: { // Duración estimada para este tipo de servicio en minutos
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 480 // Máximo 8 horas
      }
    },
    is_active: { // Para desactivar servicios sin eliminarlos
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'service_types',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['especialidad_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return ServiceType;
}; 