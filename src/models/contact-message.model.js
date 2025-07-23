// Import the DataTypes object from the sequelize library.
const { DataTypes } = require('sequelize');

// Export a function that defines the model.
module.exports = (sequelize) => {
  // Define the 'ContactMessage' model to store submissions from a contact form.
  const ContactMessage = sequelize.define('ContactMessage', {
    // Defines the 'id' column using UUID for a unique, non-sequential primary key.
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Automatically generates a UUID version 4.
      primaryKey: true
    },
    // The name of the person who sent the message.
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // The email address of the sender.
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true // Ensures the value is a valid email format.
      }
    },
    // The sender's phone number (optional).
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    // The subject of the message.
    subject: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    // The main content of the message.
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // The current status of the message, managed as a controlled list.
    status: {
      type: DataTypes.ENUM('pending', 'read', 'replied', 'archived'),
      defaultValue: 'pending' // New messages are 'pending' by default.
    },
    // The IP address from which the message was sent, for tracking.
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIP: true // Ensures the value is a valid IP address (IPv4 or IPv6).
      }
    },
    // The user agent string of the browser/client, for diagnostics.
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    // Model options
    tableName: 'contact_messages',
    freezeTableName: true, // Prevents Sequelize from pluralizing the table name.
    timestamps: true,      // Automatically adds 'createdAt' and 'updatedAt' columns.
    indexes: [
      // Index to speed up filtering messages by their status.
      { fields: ['status'] },
      // Index to quickly find all messages from a specific email address.
      { fields: ['email'] }
    ]
  });

  return ContactMessage;
};