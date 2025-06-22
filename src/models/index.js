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

// --- Definición de Asociaciones ---

// 1. User (Paciente registrado) y Appointment
User.hasMany(Appointment, {
  foreignKey: 'patientId', // FK en Appointment que apunta a User
  as: 'patientAppointments' // Alias para cuando se incluya desde User
});
Appointment.belongsTo(User, {
  foreignKey: 'patientId',
  as: 'patient' // Alias para cuando se incluya desde Appointment
});

// 2. GuestPatient (Paciente invitado) y Appointment
GuestPatient.hasMany(Appointment, {
  foreignKey: 'guestPatientId', // FK en Appointment que apunta a GuestPatient
  as: 'guestAppointments'
});
Appointment.belongsTo(GuestPatient, {
  foreignKey: 'guestPatientId',
  as: 'guestPatient'
});

// Lógica de aplicación para asegurar que solo uno sea no-nulo:
// Esto se manejará en tu código backend al crear o actualizar citas,
// no es una restricción a nivel de base de datos directamente con Sequelize.

// 3. User (Odontólogo) y Appointment
User.hasMany(Appointment, {
  foreignKey: 'dentistId', // FK en Appointment que apunta al User dentista
  as: 'dentistAppointments'
});
Appointment.belongsTo(User, {
  foreignKey: 'dentistId',
  as: 'dentist'
});

// 4. User (Odontólogo) y Disponibilidad
User.hasMany(Disponibilidad, {
  foreignKey: 'dentistId', // FK en Disponibilidad que apunta al User dentista
  as: 'dentistAvailabilities'
});
Disponibilidad.belongsTo(User, {
  foreignKey: 'dentistId',
  as: 'dentist'
});

// 5. User (Odontólogo) y Especialidad (relación Many-to-Many)
User.belongsToMany(Especialidad, {
  through: 'DentistSpecialties', // Tabla intermedia automática
  foreignKey: 'dentistId', // FK en DentistSpecialties que apunta a User
  otherKey: 'especialidadId', // FK en DentistSpecialties que apunta a Especialidad
  as: 'specialties'
});
Especialidad.belongsToMany(User, {
  through: 'DentistSpecialties',
  foreignKey: 'especialidadId',
  otherKey: 'dentistId',
  as: 'dentists'
});

// 6. Appointment y ServiceType
ServiceType.hasMany(Appointment, {
  foreignKey: 'serviceTypeId', // FK en Appointment que apunta a ServiceType
  as: 'appointments'
});
Appointment.belongsTo(ServiceType, {
  foreignKey: 'serviceTypeId',
  as: 'serviceType'
});

// 7. ServiceType y Especialidad (Opcional: Si un tipo de servicio se asocia a una especialidad)
// Esto ayuda a filtrar servicios por la especialidad del odontólogo.
Especialidad.hasMany(ServiceType, {
  foreignKey: 'especialidadId',
  as: 'serviceTypes'
});
ServiceType.belongsTo(Especialidad, {
  foreignKey: 'especialidadId',
  as: 'especialidad'
});

// --- Sincronización de la Base de Datos ---
sequelize.sync({ alter: true }) // 'alter: true' modificará las tablas existentes sin borrarlas. Úsalo con precaución en producción.
  .then(() => console.log('Base de datos y tablas sincronizadas correctamente.'))
  .catch(err => console.error('Error al sincronizar la base de datos:', err));

// Exporta todos los modelos y la instancia de Sequelize
module.exports = {
  sequelize,
  User,
  GuestPatient,
  Especialidad,
  Disponibilidad,
  ServiceType,
  Appointment,
};
