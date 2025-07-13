const { User } = require('../models/index');
const adminService = require('../services/admin-service')


exports.listDentists = async (req, res) => {

  // Extrae params de query con valores por defecto
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const doctors = await adminService.getAllDentists();
  res.status(200).json(doctors);
};