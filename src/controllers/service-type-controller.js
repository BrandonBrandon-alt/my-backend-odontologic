const { ServiceType, Especialidad } = require('../models');

// Importa los DTOs de salida
const ServiceTypeOutputDto = require('../dtos/serviceType-dto'); // Asegúrate de la ruta correcta
const EspecialidadOutputDto = require('../dtos/especialidad-dto'); // Ya se usa internamente en ServiceTypeOutputDto, pero puede ser útil si lo necesitas directamente

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
            attributes: ['id', 'name', 'description', 'is_active'] // Incluye is_active para el DTO
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: ServiceTypeOutputDto.fromList(serviceTypes) // Usa el DTO de salida aquí
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
            attributes: ['id', 'name', 'description', 'is_active'] // Incluye is_active para el DTO
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: ServiceTypeOutputDto.fromList(serviceTypes) // Usa el DTO de salida aquí
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
            attributes: ['id', 'name', 'description', 'is_active'] // Incluye is_active para el DTO
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
        data: new ServiceTypeOutputDto(serviceType) // Usa el DTO de salida aquí
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
      const { name, description, duration, especialidad_id } = req.body; // 'price' eliminado

      // Las validaciones básicas se pueden mover a un DTO de entrada (Joi schema)
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'El nombre del servicio es requerido y debe tener al menos 2 caracteres' });
      }
      if (!duration || duration < 15) {
        return res.status(400).json({ success: false, message: 'La duración es requerida y debe ser al menos 15 minutos' });
      }
      // if (!price || price <= 0) { // 'price' eliminado
      //   return res.status(400).json({ success: false, message: 'El precio es requerido y debe ser mayor a 0' });
      // }
      if (!especialidad_id) {
        return res.status(400).json({ success: false, message: 'La especialidad es requerida' });
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
        // price: parseFloat(price), // 'price' eliminado
        especialidad_id,
        is_active: true
      });

      // Para formatear la respuesta, necesitamos cargar la relación 'especialidad'
      // ya que Sequelize.create() no la carga automáticamente en el objeto retornado.
      const fullServiceType = await ServiceType.findByPk(serviceType.id, {
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            attributes: ['id', 'name', 'description', 'is_active']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tipo de servicio creado exitosamente',
        data: new ServiceTypeOutputDto(fullServiceType) // Usa el DTO de salida aquí
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
      const { name, description, duration, especialidad_id } = req.body; // 'price' eliminado

      // Las validaciones básicas se pueden mover a un DTO de entrada (Joi schema)
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'El nombre del servicio es requerido y debe tener al menos 2 caracteres' });
      }
      if (!duration || duration < 15) {
        return res.status(400).json({ success: false, message: 'La duración es requerida y debe ser al menos 15 minutos' });
      }
      // if (!price || price <= 0) { // 'price' eliminado
      //   return res.status(400).json({ success: false, message: 'El precio es requerido y debe ser mayor a 0' });
      // }
      if (!especialidad_id) {
        return res.status(400).json({ success: false, message: 'La especialidad es requerida' });
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

        if (existingServiceType && existingServiceType.id !== serviceType.id) { // Importante: Ignorar el propio ID
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
        // price: parseFloat(price), // 'price' eliminado
        especialidad_id
      });

      // Para formatear la respuesta, necesitamos cargar la relación 'especialidad'
      const fullUpdatedServiceType = await ServiceType.findByPk(updatedServiceType.id, {
        include: [
          {
            model: Especialidad,
            as: 'especialidad',
            attributes: ['id', 'name', 'description', 'is_active']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Tipo de servicio actualizado exitosamente',
        data: new ServiceTypeOutputDto(fullUpdatedServiceType) // Usa el DTO de salida aquí
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
        message: 'Tipo de servicio desactivado exitosamente',
        data: {
            id: serviceType.id,
            is_active: false
        }
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
