const { ServiceType, Especialidad } = require('../models');

const serviceTypeController = {
  // Obtener todos los tipos de servicio activos
  async getAll(req, res) {
    try {
      const serviceTypes = await ServiceType.findAll({
        where: { is_active: true },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: serviceTypes.map(serviceType => ({
          id: serviceType.id,
          name: serviceType.name,
          description: serviceType.description,
          duration: serviceType.duration,
          price: serviceType.price,
          especialidad: {
            id: serviceType.especialidad.id,
            name: serviceType.especialidad.name
          }
        }))
      });

    } catch (error) {
      console.error('Error al obtener tipos de servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener tipos de servicio por especialidad
  async getByEspecialidad(req, res) {
    try {
      const { especialidad_id } = req.params;

      const serviceTypes = await ServiceType.findAll({
        where: { 
          especialidad_id,
          is_active: true 
        },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: serviceTypes.map(serviceType => ({
          id: serviceType.id,
          name: serviceType.name,
          description: serviceType.description,
          duration: serviceType.duration,
          price: serviceType.price,
          especialidad: {
            id: serviceType.especialidad.id,
            name: serviceType.especialidad.name
          }
        }))
      });

    } catch (error) {
      console.error('Error al obtener tipos de servicio por especialidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener un tipo de servicio por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const serviceType = await ServiceType.findOne({
        where: { id, is_active: true },
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ]
      });

      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de servicio no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          id: serviceType.id,
          name: serviceType.name,
          description: serviceType.description,
          duration: serviceType.duration,
          price: serviceType.price,
          especialidad: {
            id: serviceType.especialidad.id,
            name: serviceType.especialidad.name
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener tipo de servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear un nuevo tipo de servicio
  async create(req, res) {
    try {
      const { name, description, duration, price, especialidad_id } = req.body;

      // Validaciones básicas
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del servicio es requerido y debe tener al menos 2 caracteres'
        });
      }

      if (!duration || duration < 15) {
        return res.status(400).json({
          success: false,
          message: 'La duración es requerida y debe ser al menos 15 minutos'
        });
      }

      if (!price || price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio es requerido y debe ser mayor a 0'
        });
      }

      if (!especialidad_id) {
        return res.status(400).json({
          success: false,
          message: 'La especialidad es requerida'
        });
      }

      // Verificar que la especialidad existe
      const especialidad = await Especialidad.findOne({
        where: { id: especialidad_id, is_active: true }
      });

      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada'
        });
      }

      // Verificar si ya existe un servicio con el mismo nombre en la misma especialidad
      const existingServiceType = await ServiceType.findOne({
        where: { 
          name: name.trim(), 
          especialidad_id,
          is_active: true 
        }
      });

      if (existingServiceType) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un servicio con este nombre en esta especialidad'
        });
      }

      // Crear el tipo de servicio
      const serviceType = await ServiceType.create({
        name: name.trim(),
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        especialidad_id,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Tipo de servicio creado exitosamente',
        data: {
          id: serviceType.id,
          name: serviceType.name,
          description: serviceType.description,
          duration: serviceType.duration,
          price: serviceType.price,
          especialidad: {
            id: especialidad.id,
            name: especialidad.name
          }
        }
      });

    } catch (error) {
      console.error('Error al crear tipo de servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar un tipo de servicio
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, duration, price, especialidad_id } = req.body;

      // Validaciones básicas
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del servicio es requerido y debe tener al menos 2 caracteres'
        });
      }

      if (!duration || duration < 15) {
        return res.status(400).json({
          success: false,
          message: 'La duración es requerida y debe ser al menos 15 minutos'
        });
      }

      if (!price || price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio es requerido y debe ser mayor a 0'
        });
      }

      if (!especialidad_id) {
        return res.status(400).json({
          success: false,
          message: 'La especialidad es requerida'
        });
      }

      // Buscar el tipo de servicio
      const serviceType = await ServiceType.findOne({
        where: { id, is_active: true }
      });

      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de servicio no encontrado'
        });
      }

      // Verificar que la especialidad existe
      const especialidad = await Especialidad.findOne({
        where: { id: especialidad_id, is_active: true }
      });

      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada'
        });
      }

      // Verificar si el nuevo nombre ya existe en la misma especialidad
      if (name.trim() !== serviceType.name || especialidad_id !== serviceType.especialidad_id) {
        const existingServiceType = await ServiceType.findOne({
          where: { 
            name: name.trim(), 
            especialidad_id,
            is_active: true 
          }
        });

        if (existingServiceType) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un servicio con este nombre en esta especialidad'
          });
        }
      }

      // Actualizar el tipo de servicio
      const updatedServiceType = await serviceType.update({
        name: name.trim(),
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        especialidad_id
      });

      res.json({
        success: true,
        message: 'Tipo de servicio actualizado exitosamente',
        data: {
          id: updatedServiceType.id,
          name: updatedServiceType.name,
          description: updatedServiceType.description,
          duration: updatedServiceType.duration,
          price: updatedServiceType.price,
          especialidad: {
            id: especialidad.id,
            name: especialidad.name
          }
        }
      });

    } catch (error) {
      console.error('Error al actualizar tipo de servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Desactivar un tipo de servicio (soft delete)
  async deactivate(req, res) {
    try {
      const { id } = req.params;

      const serviceType = await ServiceType.findOne({
        where: { id, is_active: true }
      });

      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de servicio no encontrado'
        });
      }

      await serviceType.update({ is_active: false });

      res.json({
        success: true,
        message: 'Tipo de servicio desactivado exitosamente'
      });

    } catch (error) {
      console.error('Error al desactivar tipo de servicio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = serviceTypeController; 