const especialidadService = require('../services/especialidad-service');

const especialidadController = {
  async getAll(req, res) {
    try {
      const data = await especialidadService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener especialidades:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await especialidadService.getById(id);
      res.json({ success: true, data });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error al obtener especialidad:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async create(req, res) {
    try {
      const { name, description } = req.body;
      const result = await especialidadService.create({ name, description });
      res.status(201).json(result);
    } catch (error) {
      if (error.status === 400 || error.status === 409) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Error al crear especialidad:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const result = await especialidadService.update(id, { name, description });
      res.json(result);
    } catch (error) {
      if (error.status === 400 || error.status === 404 || error.status === 409) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Error al actualizar especialidad:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async deactivate(req, res) {
    try {
      const { id } = req.params;
      const result = await especialidadService.deactivate(id);
      res.json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error al desactivar especialidad:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
};

module.exports = especialidadController;
