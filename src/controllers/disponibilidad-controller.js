const disponibilidadService = require('../services/disponibilidad-service');

const disponibilidadController = {
  async getAll(req, res) {
    try {
      const data = await disponibilidadService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener disponibilidades:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },
  async getByEspecialidad(req, res) {
    try {
      const { especialidad_id } = req.params;
      const { date } = req.query;
      const data = await disponibilidadService.getByEspecialidad(especialidad_id, date);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener disponibilidades por especialidad:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },
  async getByDentist(req, res) {
    try {
      const { dentist_id } = req.params;
      const { date } = req.query;
      const data = await disponibilidadService.getByDentist(dentist_id, date);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener disponibilidades por dentista:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },
  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await disponibilidadService.getById(id);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
  },
  async create(req, res) {
    try {
      const result = await disponibilidadService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error al crear disponibilidad:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await disponibilidadService.update(id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
  },
  async deactivate(req, res) {
    try {
      const { id } = req.params;
      const result = await disponibilidadService.deactivate(id);
      res.json(result);
    } catch (error) {
      console.error('Error al desactivar disponibilidad:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
  }
};

module.exports = disponibilidadController;
