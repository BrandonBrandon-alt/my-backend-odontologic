const serviceTypeService = require('../services/service-type-service');

const serviceTypeController = {
  async getAll(req, res) {
    try {
      const data = await serviceTypeService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener tipos de servicio:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async getByEspecialidad(req, res) {
    try {
      const { especialidad_id } = req.params;
      const data = await serviceTypeService.getByEspecialidad(especialidad_id);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener tipos de servicio por especialidad:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await serviceTypeService.getById(id);
      res.json({ success: true, data });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error al obtener tipo de servicio:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async create(req, res) {
    try {
      const { name, description, duration, especialidad_id } = req.body;
      const result = await serviceTypeService.create({ name, description, duration, especialidad_id });
      res.status(201).json(result);
    } catch (error) {
      if (error.status === 400 || error.status === 404 || error.status === 409) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Error al crear tipo de servicio:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, duration, especialidad_id } = req.body;
      const result = await serviceTypeService.update(id, { name, description, duration, especialidad_id });
      res.json(result);
    } catch (error) {
      if (error.status === 400 || error.status === 404 || error.status === 409) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error('Error al actualizar tipo de servicio:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async deactivate(req, res) {
    try {
      const { id } = req.params;
      const result = await serviceTypeService.deactivate(id);
      res.json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error al desactivar tipo de servicio:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
};

module.exports = serviceTypeController;
