// Import the DataTypes object from the sequelize library.
const { DataTypes } = require("sequelize");

// Export a function that defines the model.
// This function will be called by Sequelize to register the 'User' model.
module.exports = (sequelize) => {
  // Define the 'User' model. This corresponds to the 'users' table in the database.
  const User = sequelize.define("User", {
    // Defines the 'id' column, the primary key.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // User's full name.
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    // User's unique identification number (e.g., national ID, passport number).
    id_number: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    // User's email address, used for login and communication. Must be unique.
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    // User's hashed password. Never store plain text passwords.
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    // User's contact phone number.
    phone: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    // User's physical address. This field is optional.
    address: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    // User's date of birth. This field is optional.
    birth_date: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    // Defines the user's role within the application.
    role: {
      // ENUM restricts the value to one of the specified strings.
      type: DataTypes.ENUM("user", "dentist", "admin"),
      allowNull: false,
      defaultValue: "user", // New users will have the 'user' role by default.
    },
    // Defines the current status of the user's account.
    status: {
      type: DataTypes.ENUM("active", "locked", "inactive"),
      allowNull: false,
      // New users start as 'inactive' until they activate their account.
      defaultValue: "inactive",
    },
    // A temporary code sent to the user to verify their email address.
    activation_code: {
      type: DataTypes.STRING,
      allowNull: true, // It's null after activation or if not needed.
    },
    // The timestamp when the activation code expires.
    activation_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // A temporary code for the "forgot password" feature.
    password_reset_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // The timestamp when the password reset code expires.
    password_reset_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    // Model options
    tableName: 'users',      // Explicitly set the table name.
    freezeTableName: true,   // Prevent Sequelize from pluralizing the name.
    timestamps: true,        // Automatically add createdAt and updatedAt columns.
    indexes: [               // Add indexes to improve query performance.
      { fields: ['email'] },
      { fields: ['id_number'] },
      { fields: ['status'] }
    ]
  });

  return User;
};