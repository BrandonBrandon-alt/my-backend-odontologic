const createGuestAppointmentSchema = require('./create-guest-appointment-dto');
const createUserAppointmentSchema = require('./create-user-appointment-dto');
const updateAppointmentStatusSchema = require('./update-appointment-status-dto');
const createGuestPatientSchema = require('./create-guest-patient-dto');
const loginSchema = require('./login-dto');
const registroSchema = require('./registro-dto');
const updateProfileSchema = require('./update-profile-dto');
const changedPasswordSchema = require('./changed-password-dto');
const resetPasswordSchema = require('./reset-password-dto');

module.exports = {
  createGuestAppointmentSchema,
  createUserAppointmentSchema,
  updateAppointmentStatusSchema,
  createGuestPatientSchema,
  loginSchema,
  registroSchema,
  updateProfileSchema,
  changedPasswordSchema,
  resetPasswordSchema
}; 