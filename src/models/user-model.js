const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
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
    activation_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_reset_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    freezeTableName: true,
    timestamps: true,
  });

  return User;
};
