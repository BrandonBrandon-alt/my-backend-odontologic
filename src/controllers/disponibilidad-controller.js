const { Disponibilidad, User, Especialidad, Appointment } = require('../models');
const { Op } = require('sequelize'); // Importa Op para operaciones de Sequelize

// Importa los DTOs de salida
const DisponibilidadOutputDto = require('../dtos/disponibilidad-dto'); // Asegúrate de la ruta correcta
const DentistOutputDto = require('../dtos/dentist-dto'); // Solo si lo necesitas para un caso particular, pero DisponibilidadOutputDto ya lo incluye
const EspecialidadOutputDto = require('../dtos/especialidad-dto'); // Sólo si lo necesitas para un caso particular, pero DisponibilidadOutputDto ya lo incluye

const disponibilidadController = {
  // Obtener todas las disponibilidades activas
  async getAll(req, res) {
    try {
      const disponibilidades = await Disponibilidad.findAll({
        where: { is_active: true },
        include: [
          {
            model: User,
            as: 'dentist',
            where: { status: 'active' },
            attributes: ['id', 'name']
          },
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ],
        order: [['date', 'ASC'], ['start_time', 'ASC']]
      });

      // Usa el método estático fromList del DTO de Disponibilidad
      res.json({
        success: true,
        data: DisponibilidadOutputDto.fromList(disponibilidades)
      });

    } catch (error) {
      console.error('Error al obtener disponibilidades:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener disponibilidades por especialidad
  async getByEspecialidad(req, res) {
    try {
      const { especialidad_id } = req.params;
      const { date } = req.query; // Fecha opcional para filtrar

      const whereClause = {
        especialidad_id,
        is_active: true
      };

      if (date) {
        whereClause.date = date;
      }

      const disponibilidades = await Disponibilidad.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'dentist',
            where: { status: 'active' },
            attributes: ['id', 'name']
          },
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ],
        order: [['date', 'ASC'], ['start_time', 'ASC']]
      });

      // Usa el método estático fromList del DTO de Disponibilidad
      res.json({
        success: true,
        data: DisponibilidadOutputDto.fromList(disponibilidades)
      });

    } catch (error) {
      console.error('Error al obtener disponibilidades por especialidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener disponibilidades por dentista
  async getByDentist(req, res) {
    try {
      const { dentist_id } = req.params;
      const { date } = req.query; // Fecha opcional para filtrar

      const whereClause = {
        dentist_id,
        is_active: true
      };

      if (date) {
        whereClause.date = date;
      }

      const disponibilidades = await Disponibilidad.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'dentist',
            where: { status: 'active' },
            attributes: ['id', 'name']
          },
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ],
        order: [['date', 'ASC'], ['start_time', 'ASC']]
      });

      // Usa el método estático fromList del DTO de Disponibilidad
      res.json({
        success: true,
        data: DisponibilidadOutputDto.fromList(disponibilidades)
      });

    } catch (error) {
      console.error('Error al obtener disponibilidades por dentista:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener una disponibilidad por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const disponibilidad = await Disponibilidad.findOne({
        where: { id, is_active: true },
        include: [
          {
            model: User,
            as: 'dentist',
            where: { status: 'active' },
            attributes: ['id', 'name']
          },
          {
            model: Especialidad,
            as: 'especialidad',
            where: { is_active: true },
            attributes: ['id', 'name']
          }
        ]
      });

      if (!disponibilidad) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidad no encontrada'
        });
      }

      // Usa el constructor del DTO de Disponibilidad
      res.json({
        success: true,
        data: new DisponibilidadOutputDto(disponibilidad)
      });

    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear una nueva disponibilidad
  async create(req, res) {
    try {
      const { dentist_id, especialidad_id, date, start_time, end_time } = req.body;

      // Aquí deberías integrar un DTO de entrada (Joi schema) para validar req.body
      // Ejemplo (comentado para no introducir Joi aquí directamente sin su schema):
      /*
      const { error, value } = CreateDisponibilidadInputSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.details.map(d => ({ field: d.context.key, message: d.message }))
        });
      }
      const { dentist_id, especialidad_id, date, start_time, end_time } = value;
      */

      // Validaciones básicas (se pueden mover a un Input DTO)
      if (!dentist_id) {
        return res.status(400).json({ success: false, message: 'El dentista es requerido' });
      }
      if (!especialidad_id) {
        return res.status(400).json({ success: false, message: 'La especialidad es requerida' });
      }
      if (!date) {
        return res.status(400).json({ success: false, message: 'La fecha es requerida' });
      }
      if (!start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'La hora de inicio y fin son requeridas' });
      }
      if (start_time >= end_time) {
        return res.status(400).json({ success: false, message: 'La hora de inicio debe ser menor que la hora de fin' });
      }

      // Verificar que la fecha no sea en el pasado
      const disponibilidadDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (disponibilidadDate < today) {
        return res.status(400).json({
          success: false,
          message: 'No se puede crear disponibilidad para fechas pasadas'
        });
      }

      // Verificar que el dentista existe y es un dentista
      const dentist = await User.findOne({
        where: { id: dentist_id, role: 'dentist', status: 'active' }
      });

      if (!dentist) {
        return res.status(404).json({
          success: false,
          message: 'Dentista no encontrado'
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

      // Verificar que no hay conflicto de horarios para el mismo dentista en la misma fecha
      const conflictingDisponibilidad = await Disponibilidad.findOne({
        where: {
          dentist_id,
          date,
          is_active: true,
          [Op.or]: [ // Usar Op directamente
            {
              start_time: {
                [Op.lt]: end_time
              },
              end_time: {
                [Op.gt]: start_time
              }
            }
          ]
        }
      });

      if (conflictingDisponibilidad) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una disponibilidad que se superpone con este horario'
        });
      }

      // Crear la disponibilidad
      const disponibilidad = await Disponibilidad.create({
        dentist_id,
        especialidad_id,
        date,
        start_time,
        end_time,
        is_active: true
      });

      // Para formatear la respuesta, podemos cargar las relaciones (dentist y especialidad)
      // para que el DTO pueda usarlas. Esto puede requerir un segundo fetch o una opción de `returning: true` en algunos ORMs.
      // O podemos simplemente pasar los objetos 'dentist' y 'especialidad' que ya recuperamos.
      const fullDisponibilidad = await Disponibilidad.findByPk(disponibilidad.id, {
          include: [
              { model: User, as: 'dentist', attributes: ['id', 'name'] },
              { model: Especialidad, as: 'especialidad', attributes: ['id', 'name'] }
          ]
      });

      res.status(201).json({
        success: true,
        message: 'Disponibilidad creada exitosamente',
        data: new DisponibilidadOutputDto(fullDisponibilidad) // Usa el DTO aquí
      });

    } catch (error) {
      console.error('Error al crear disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar una disponibilidad
  async update(req, res) {
    try {
      const { id } = req.params;
      const { dentist_id, especialidad_id, date, start_time, end_time } = req.body;

      // Aquí deberías integrar un DTO de entrada (Joi schema) para validar req.body

      // Validaciones básicas
      if (!dentist_id) {
        return res.status(400).json({ success: false, message: 'El dentista es requerido' });
      }
      if (!especialidad_id) {
        return res.status(400).json({ success: false, message: 'La especialidad es requerida' });
      }
      if (!date) {
        return res.status(400).json({ success: false, message: 'La fecha es requerida' });
      }
      if (!start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'La hora de inicio y fin son requeridas' });
      }
      if (start_time >= end_time) {
        return res.status(400).json({ success: false, message: 'La hora de inicio debe ser menor que la hora de fin' });
      }

      // Buscar la disponibilidad
      const disponibilidad = await Disponibilidad.findOne({
        where: { id, is_active: true }
      });

      if (!disponibilidad) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidad no encontrada'
        });
      }

      // Verificar que el dentista existe y es un dentista
      const dentist = await User.findOne({
        where: { id: dentist_id, role: 'dentist', status: 'active' }
      });

      if (!dentist) {
        return res.status(404).json({
          success: false,
          message: 'Dentista no encontrado'
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

      // Verificar que no hay conflicto de horarios (excluyendo la disponibilidad actual)
      const conflictingDisponibilidad = await Disponibilidad.findOne({
        where: {
          dentist_id,
          date,
          is_active: true,
          id: { [Op.ne]: id }, // Usar Op directamente
          [Op.or]: [ // Usar Op directamente
            {
              start_time: {
                [Op.lt]: end_time
              },
              end_time: {
                [Op.gt]: start_time
              }
            }
          ]
        }
      });

      if (conflictingDisponibilidad) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una disponibilidad que se superpone con este horario'
        });
      }

      // Actualizar la disponibilidad
      await disponibilidad.update({
        dentist_id,
        especialidad_id,
        date,
        start_time,
        end_time
      });

      // Para formatear la respuesta, necesitamos cargar las relaciones después de la actualización
      const updatedDisponibilidad = await Disponibilidad.findByPk(disponibilidad.id, {
          include: [
              { model: User, as: 'dentist', attributes: ['id', 'name'] },
              { model: Especialidad, as: 'especialidad', attributes: ['id', 'name'] }
          ]
      });

      res.json({
        success: true,
        message: 'Disponibilidad actualizada exitosamente',
        data: new DisponibilidadOutputDto(updatedDisponibilidad) // Usa el DTO aquí
      });

    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Desactivar una disponibilidad (soft delete)
  async deactivate(req, res) {
    try {
      const { id } = req.params;

      const disponibilidad = await Disponibilidad.findOne({
        where: { id, is_active: true }
      });

      if (!disponibilidad) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidad no encontrada'
        });
      }

      // Verificar si hay citas pendientes o confirmadas para esta disponibilidad
      const pendingAppointments = await Appointment.count({
        where: {
          disponibilidad_id: id,
          status: ['pending', 'confirmed']
        }
      });

      if (pendingAppointments > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede desactivar la disponibilidad porque tiene citas pendientes o confirmadas'
        });
      }

      await disponibilidad.update({ is_active: false });

      // Opcional: Podrías devolver el DTO de la disponibilidad actualizada si lo necesitaras en el frontend
      res.json({
        success: true,
        message: 'Disponibilidad desactivada exitosamente',
        data: {
            id: disponibilidad.id,
            is_active: false
        }
      });

    } catch (error) {
      console.error('Error al desactivar disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = disponibilidadController;
