const { GuestPatient } = require('../models');
const createGuestPatientSchema = require('../dtos/create-guest-patient-dto');

const guestPatientController = {
  // Crear un nuevo paciente invitado
  async create(req, res) {
    try {
      // Validar datos de entrada
      const { error, value } = createGuestPatientSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Verificar si ya existe un paciente con el mismo email (si se proporciona)
      if (value.email) {
        const existingPatient = await GuestPatient.findOne({
          where: { email: value.email, is_active: true }
        });
        
        if (existingPatient) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un paciente con este email'
          });
        }
      }

      // Crear el paciente invitado
      const guestPatient = await GuestPatient.create({
        name: value.name,
        phone: value.phone,
        email: value.email || null,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Paciente invitado creado exitosamente',
        data: {
          id: guestPatient.id,
          name: guestPatient.name,
          phone: guestPatient.phone,
          email: guestPatient.email
        }
      });

    } catch (error) {
      console.error('Error al crear paciente invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener un paciente invitado por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const guestPatient = await GuestPatient.findOne({
        where: { id, is_active: true }
      });

      if (!guestPatient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente invitado no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          id: guestPatient.id,
          name: guestPatient.name,
          phone: guestPatient.phone,
          email: guestPatient.email,
          created_at: guestPatient.createdAt
        }
      });

    } catch (error) {
      console.error('Error al obtener paciente invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar un paciente invitado
  async update(req, res) {
    try {
      const { id } = req.params;

      // Validar datos de entrada
      const { error, value } = createGuestPatientSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Buscar el paciente invitado
      const guestPatient = await GuestPatient.findOne({
        where: { id, is_active: true }
      });

      if (!guestPatient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente invitado no encontrado'
        });
      }

      // Verificar si el email ya existe en otro paciente (si se está actualizando)
      if (value.email && value.email !== guestPatient.email) {
        const existingPatient = await GuestPatient.findOne({
          where: { 
            email: value.email, 
            is_active: true,
            id: { [require('sequelize').Op.ne]: id }
          }
        });
        
        if (existingPatient) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otro paciente con este email'
          });
        }
      }

      // Actualizar el paciente
      await guestPatient.update({
        name: value.name,
        phone: value.phone,
        email: value.email || null
      });

      res.json({
        success: true,
        message: 'Paciente invitado actualizado exitosamente',
        data: {
          id: guestPatient.id,
          name: guestPatient.name,
          phone: guestPatient.phone,
          email: guestPatient.email
        }
      });

    } catch (error) {
      console.error('Error al actualizar paciente invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Desactivar un paciente invitado (soft delete)
  async deactivate(req, res) {
    try {
      const { id } = req.params;

      const guestPatient = await GuestPatient.findOne({
        where: { id, is_active: true }
      });

      if (!guestPatient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente invitado no encontrado'
        });
      }

      await guestPatient.update({ is_active: false });

      res.json({
        success: true,
        message: 'Paciente invitado desactivado exitosamente'
      });

    } catch (error) {
      console.error('Error al desactivar paciente invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = guestPatientController; 