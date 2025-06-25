const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const GuestPatient = sequelize.define("GuestPatient", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Puede ser nulo si no lo exiges
      unique: true, // Asegura que no haya emails duplicados si se proporcionan
      validate: {
        isEmail: true // Validación de formato de email
      }
    },
    is_active: { // Para desactivar pacientes sin eliminarlos
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'guest_patients',
    freezeTableName: true,
    timestamps: true, // Puedes decidir si quieres timestamps aquí o no
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return GuestPatient;
}; 