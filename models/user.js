// filepath: /home/brandonmontealegre/Documentos/pruebaJavascript/my-backend/models/user.js
require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
  }
);

const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  id_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
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
  password_reset_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = { User, sequelize };
