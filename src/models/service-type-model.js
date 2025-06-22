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
    duration_minutes: { // Duración estimada para este tipo de servicio en minutos
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
    },
    // especialidadId (FK) se agregará en las asociaciones si es necesario
  }, {
    tableName: 'service_types',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['is_active']
      },
      {
        fields: ['especialidadId']
      }
    ]
  });

  return ServiceType;
}; 