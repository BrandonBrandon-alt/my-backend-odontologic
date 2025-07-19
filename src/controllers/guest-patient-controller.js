const guestPatientService = require('../services/guest-patient-service');

const guestPatientController = {
  async create(req, res) {
    try {
      const result = await guestPatientService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ success: false, message: error.message, errors: error.errors });
      }
      if (error.status === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      console.error('Error al crear paciente invitado:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await guestPatientService.getById(id);
      res.json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error al obtener paciente invitado:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await guestPatientService.update(id, req.body);
      res.json(result);
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ success: false, message: error.message, errors: error.errors });
      }
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.status === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      console.error('Error al actualizar paciente invitado:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  async deactivate(req, res) {
    try {
      const { id } = req.params;
      const result = await guestPatientService.deactivate(id);
      res.json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error('Error al desactivar paciente invitado:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
};

module.exports = guestPatientController; 