'use strict';

require("dotenv").config();
const { Sequelize } = require("sequelize");

// 1. DATABASE CONNECTION
// Centralized Sequelize instance using environment variables.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // Set to console.log to see SQL queries in development.
  }
);

// 2. MODEL LOADING
// Import all models and initialize them with the sequelize instance.
const models = {
  User: require('./user.model')(sequelize),
  GuestPatient: require('./guest-patient.model')(sequelize),
  Specialty: require('./specialty.model')(sequelize),
  Availability: require('./availability.model')(sequelize), // Formerly Disponibilidad
  ServiceType: require('./service-type.model')(sequelize),
  Appointment: require('./appointment.model')(sequelize),
  ContactMessage: require('./contact-message.model')(sequelize),
  RefreshToken: require('./refresh-token.model')(sequelize),
};

// 3. DEFINE ASSOCIATIONS
// A more robust way to associate models. This loop finds any model
// with a static 'associate' method and executes it.
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// User (as Patient) and Appointment (One-to-Many)
models.User.hasMany(models.Appointment, { foreignKey: 'user_id', as: 'appointments' });
models.Appointment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

// GuestPatient and Appointment (One-to-Many)
models.GuestPatient.hasMany(models.Appointment, { foreignKey: 'guest_patient_id', as: 'appointments' });
models.Appointment.belongsTo(models.GuestPatient, { foreignKey: 'guest_patient_id', as: 'guestPatient' });

// Availability and Appointment (One-to-Many)
models.Availability.hasMany(models.Appointment, { foreignKey: 'availability_id', as: 'appointments' });
models.Appointment.belongsTo(models.Availability, { foreignKey: 'availability_id', as: 'availability' });

// ServiceType and Appointment (One-to-Many)
models.ServiceType.hasMany(models.Appointment, { foreignKey: 'service_type_id', as: 'appointments' });
models.Appointment.belongsTo(models.ServiceType, { foreignKey: 'service_type_id', as: 'serviceType' });

// User (as Dentist) and Availability (One-to-Many)
models.User.hasMany(models.Availability, { foreignKey: 'dentist_id', as: 'availabilities' });
models.Availability.belongsTo(models.User, { foreignKey: 'dentist_id', as: 'dentist' });

// Specialty and Availability (One-to-Many)
models.Specialty.hasMany(models.Availability, { foreignKey: 'specialty_id', as: 'availabilities' });
models.Availability.belongsTo(models.Specialty, { foreignKey: 'specialty_id', as: 'specialty' });

// Specialty and ServiceType (One-to-Many)
models.Specialty.hasMany(models.ServiceType, { foreignKey: 'specialty_id', as: 'serviceTypes' });
models.ServiceType.belongsTo(models.Specialty, { foreignKey: 'specialty_id', as: 'specialty' });

// User (as Dentist) and Specialty (Many-to-Many)
// This creates a join table 'DentistSpecialties' automatically.
models.User.belongsToMany(models.Specialty, {
  through: 'DentistSpecialties',
  foreignKey: 'dentist_id',
  otherKey: 'specialty_id',
  as: 'specialties'
});
models.Specialty.belongsToMany(models.User, {
  through: 'DentistSpecialties',
  foreignKey: 'specialty_id',
  otherKey: 'dentist_id',
  as: 'dentists'
});

// 4. EXPORT
// Export the sequelize instance and all models.
module.exports = {
  ...models,
  sequelize,
};