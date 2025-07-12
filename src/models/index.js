'use strict';

require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false, // Puedes cambiar a true en desarrollo para ver las consultas SQL
  }
);

// Importa tus modelos
const User = require('./user-model')(sequelize);
const GuestPatient = require('./guest-patient-model')(sequelize);
const Especialidad = require('./especialidad-model')(sequelize);
const Disponibilidad = require('./disponibilidad-model')(sequelize);
const ServiceType = require('./service-type-model')(sequelize);
const Appointment = require('./appointment-model')(sequelize);
const ContactMessage = require('./contact-message-model')(sequelize);

// --- Definición de Asociaciones ---

// 1. User (Paciente registrado) y Appointment
User.hasMany(Appointment, {
  foreignKey: 'user_id', // FK en Appointment que apunta a User
  as: 'userAppointments' // Alias para cuando se incluya desde User
});
Appointment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user' // Alias para cuando se incluya desde Appointment
});

// 2. GuestPatient (Paciente invitado) y Appointment
GuestPatient.hasMany(Appointment, {
  foreignKey: 'guest_patient_id', // FK en Appointment que apunta a GuestPatient
  as: 'guestAppointments'
});
Appointment.belongsTo(GuestPatient, {
  foreignKey: 'guest_patient_id',
  as: 'guestPatient'
});

// 3. Appointment y Disponibilidad
Disponibilidad.hasMany(Appointment, {
  foreignKey: 'disponibilidad_id', // FK en Appointment que apunta a Disponibilidad
  as: 'appointments'
});
Appointment.belongsTo(Disponibilidad, {
  foreignKey: 'disponibilidad_id',
  as: 'disponibilidad'
});

// 4. Appointment y ServiceType
ServiceType.hasMany(Appointment, {
  foreignKey: 'service_type_id', // FK en Appointment que apunta a ServiceType
  as: 'appointments'
});
Appointment.belongsTo(ServiceType, {
  foreignKey: 'service_type_id',
  as: 'serviceType'
});

// 5. User (Odontólogo) y Disponibilidad
User.hasMany(Disponibilidad, {
  foreignKey: 'dentist_id', // FK en Disponibilidad que apunta al User dentista
  as: 'dentistAvailabilities'
});
Disponibilidad.belongsTo(User, {
  foreignKey: 'dentist_id',
  as: 'dentist'
});

// 6. Disponibilidad y Especialidad
Especialidad.hasMany(Disponibilidad, {
  foreignKey: 'especialidad_id', // FK en Disponibilidad que apunta a Especialidad
  as: 'disponibilidades'
});
Disponibilidad.belongsTo(Especialidad, {
  foreignKey: 'especialidad_id',
  as: 'especialidad'
});

// 7. User (Odontólogo) y Especialidad (relación Many-to-Many)
User.belongsToMany(Especialidad, {
  through: 'DentistSpecialties', // Tabla intermedia automática
  foreignKey: 'dentist_id', // FK en DentistSpecialties que apunta a User
  otherKey: 'especialidad_id', // FK en DentistSpecialties que apunta a Especialidad
  as: 'specialties'
});
Especialidad.belongsToMany(User, {
  through: 'DentistSpecialties',
  foreignKey: 'especialidad_id',
  otherKey: 'dentist_id',
  as: 'dentists'
});

// 8. ServiceType y Especialidad
Especialidad.hasMany(ServiceType, {
  foreignKey: 'especialidad_id',
  as: 'serviceTypes'
});
ServiceType.belongsTo(Especialidad, {
  foreignKey: 'especialidad_id',
  as: 'especialidad'
});

// --- Sincronización de la Base de Datos ---
// Comentado para evitar sincronización automática
// sequelize.sync({ alter: true }) // 'alter: true' modificará las tablas existentes sin borrarlas. Úsalo con precaución en producción.
//   .then(() => console.log('Base de datos y tablas sincronizadas correctamente.'))
//   .catch(err => console.error('Error al sincronizar la base de datos:', err));

// Exporta todos los modelos y la instancia de Sequelize
module.exports = {
  sequelize,
  User,
  GuestPatient,
  Especialidad,
  Disponibilidad,
  ServiceType,
  Appointment,
  ContactMessage,
};
