const serverAppointmentService = require('../services/server-appointment-service');

exports.getAppointmentStats = async (req, res) => {
  try {
    const stats = await serverAppointmentService.getAppointmentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await serverAppointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const appointment = await serverAppointmentService.getById(req.params.id);
    res.json(appointment);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const result = await serverAppointmentService.updateStatus(req.params.id, req.body.status);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 