const appointmentService = require('../services/appointment-service');

const createGuestAppointment = async (req, res, next) => {
  try {
    const result = await appointmentService.createGuestAppointment(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const createUserAppointment = async (req, res, next) => {
  try {
    const result = await appointmentService.createUserAppointment(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const confirmAppointmentByEmail = async (req, res, next) => {
  try {
    const result = await appointmentService.confirmAppointmentByEmail(req.query.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const result = await appointmentService.getMyAppointments(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createGuestAppointment,
  createUserAppointment,
  confirmAppointmentByEmail,
  getMyAppointments,
}; 