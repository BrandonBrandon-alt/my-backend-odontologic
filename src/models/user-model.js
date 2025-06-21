require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // Puedes dejarlo en true para ver las consultas SQL en desarrollo
  }
);

const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  id_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: true },
  birth_date: { type: DataTypes.DATE, allowNull: true },
  role: {
    type: DataTypes.ENUM("user", "dentist", "admin"),
    allowNull: false,
    defaultValue: "user",
  },
  status: {
    type: DataTypes.ENUM("active", "locked", "inactive"),
    allowNull: false,
    defaultValue: "inactive",
  },
  activation_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Nuevo campo para la fecha de expiración del código de activación
  activation_expires_at: {
    type: DataTypes.DATE, // Tipo de dato para almacenar fechas y horas
    allowNull: true, // Puede ser nulo si el código no está activo o si ya expiró/fue usado
  },
  password_reset_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Nuevo campo para la fecha de expiración del código de reseteo de contraseña
  password_reset_expires_at: {
    type: DataTypes.DATE, // Tipo de dato para almacenar fechas y horas
    allowNull: true, // Puede ser nulo si el código no está activo o si ya expiró/fue usado
  },
}, {
  tableName: 'users',
  freezeTableName: true,
  timestamps: true,
});

module.exports = { User, sequelize };
