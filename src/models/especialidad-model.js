const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Especialidad = sequelize.define("Especialidad", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: { // Para desactivar especialidades sin eliminarlas
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'especialidades',
    freezeTableName: true,
    timestamps: true, // Opcional, puedes desactivarlos si no los necesitas
    indexes: [
      {
        fields: ['is_active']
      }
    ]
  });

  return Especialidad;
}; 