const { Especialidad } = require('../models');
// Importa el DTO que creaste
const EspecialidadOutputDto = require('../dtos/especialidad-dto'); // Ajusta la ruta si es necesario

const especialidadController = {
  // Obtener todas las especialidades activas
  async getAll(req, res) {
    try {
      const especialidades = await Especialidad.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });

      // Usa el método estático fromList del DTO para mapear todas las especialidades
      res.json({
        success: true,
        data: EspecialidadOutputDto.fromList(especialidades)
      });

    } catch (error) {
      console.error('Error al obtener especialidades:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener una especialidad por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const especialidad = await Especialidad.findOne({
        where: { id, is_active: true }
      });

      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada'
        });
      }

      // Usa el constructor del DTO para formatear la especialidad individual
      res.json({
        success: true,
        data: new EspecialidadOutputDto(especialidad)
      });

    } catch (error) {
      console.error('Error al obtener especialidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear una nueva especialidad
  async create(req, res) {
    try {
      const { name, description } = req.body;

      // Validaciones básicas (idealmente, se harían con un Input DTO y una librería de validación)
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la especialidad es requerido y debe tener al menos 2 caracteres'
        });
      }

      // Verificar si ya existe una especialidad con el mismo nombre
      const existingEspecialidad = await Especialidad.findOne({
        where: { name: name.trim(), is_active: true }
      });

      if (existingEspecialidad) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una especialidad con este nombre'
        });
      }

      // Crear la especialidad
      const especialidad = await Especialidad.create({
        name: name.trim(),
        description: description || null,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Especialidad creada exitosamente',
        // Usa el constructor del DTO para formatear la especialidad creada
        data: new EspecialidadOutputDto(especialidad)
      });

    } catch (error) {
      console.error('Error al crear especialidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar una especialidad
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validaciones básicas
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la especialidad es requerido y debe tener al menos 2 caracteres'
        });
      }

      // Buscar la especialidad
      const especialidad = await Especialidad.findOne({
        where: { id, is_active: true }
      });

      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada'
        });
      }

      // Verificar si el nuevo nombre ya existe en otra especialidad
      if (name.trim() !== especialidad.name) {
        const existingEspecialidad = await Especialidad.findOne({
          where: { name: name.trim(), is_active: true }
        });

        if (existingEspecialidad) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otra especialidad con este nombre'
          });
        }
      }

      // Actualizar la especialidad
      const updatedEspecialidad = await especialidad.update({
        name: name.trim(),
        description: description || null
      });

      res.json({
        success: true,
        message: 'Especialidad actualizada exitosamente',
        // Usa el constructor del DTO para formatear la especialidad actualizada
        data: new EspecialidadOutputDto(updatedEspecialidad)
      });

    } catch (error) {
      console.error('Error al actualizar especialidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Desactivar una especialidad (soft delete)
  async deactivate(req, res) {
    try {
      const { id } = req.params;

      const especialidad = await Especialidad.findOne({
        where: { id, is_active: true }
      });

      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada'
        });
      }

      await especialidad.update({ is_active: false });

      // Para la desactivación, puedes optar por devolver un DTO simple o un mensaje con los IDs afectados
      res.json({
        success: true,
        message: 'Especialidad desactivada exitosamente',
        data: {
          id: especialidad.id,
          is_active: false
        }
      });

    } catch (error) {
      console.error('Error al desactivar especialidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = especialidadController;
