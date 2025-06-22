const disponibilidadController = require('../../controllers/disponibilidad-controller');

// Mock de los modelos
jest.mock('../../models', () => ({
  Disponibilidad: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  User: {
    findOne: jest.fn()
  },
  Especialidad: {
    findOne: jest.fn()
  },
  Appointment: {
    count: jest.fn()
  }
}));

const { Disponibilidad, User, Especialidad, Appointment } = require('../../models');

describe('Disponibilidad Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debería listar disponibilidades exitosamente', async () => {
      const mockDisponibilidades = [
        {
          id: 1,
          date: '2025-12-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          dentist: { id: 1, name: 'Dr. García' },
          especialidad: { id: 1, name: 'Odontología' }
        },
        {
          id: 2,
          date: '2025-12-16',
          start_time: '10:00:00',
          end_time: '11:00:00',
          dentist: { id: 2, name: 'Dr. López' },
          especialidad: { id: 2, name: 'Ortodoncia' }
        }
      ];

      Disponibilidad.findAll.mockResolvedValue(mockDisponibilidades);

      await disponibilidadController.getAll(mockReq, mockRes);

      expect(Disponibilidad.findAll).toHaveBeenCalledWith({
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
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDisponibilidades.map(disp => ({
          id: disp.id,
          date: disp.date,
          start_time: disp.start_time,
          end_time: disp.end_time,
          dentist: {
            id: disp.dentist.id,
            name: disp.dentist.name
          },
          especialidad: {
            id: disp.especialidad.id,
            name: disp.especialidad.name
          }
        }))
      });
    });
  });

  describe('getByEspecialidad', () => {
    it('debería obtener disponibilidades por especialidad', async () => {
      const mockDisponibilidades = [
        {
          id: 1,
          date: '2025-12-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          dentist: { id: 1, name: 'Dr. García' },
          especialidad: { id: 1, name: 'Odontología' }
        }
      ];

      mockReq.params = { especialidad_id: 1 };
      mockReq.query = {};
      Disponibilidad.findAll.mockResolvedValue(mockDisponibilidades);

      await disponibilidadController.getByEspecialidad(mockReq, mockRes);

      expect(Disponibilidad.findAll).toHaveBeenCalledWith({
        where: { especialidad_id: 1, is_active: true },
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
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('getByDentist', () => {
    it('debería obtener disponibilidades por dentista', async () => {
      const mockDisponibilidades = [
        {
          id: 1,
          date: '2025-12-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          dentist: { id: 1, name: 'Dr. García' },
          especialidad: { id: 1, name: 'Odontología' }
        }
      ];

      mockReq.params = { dentist_id: 1 };
      mockReq.query = {};
      Disponibilidad.findAll.mockResolvedValue(mockDisponibilidades);

      await disponibilidadController.getByDentist(mockReq, mockRes);

      expect(Disponibilidad.findAll).toHaveBeenCalledWith({
        where: { dentist_id: 1, is_active: true },
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
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('getById', () => {
    it('debería obtener disponibilidad por id exitosamente', async () => {
      const mockDisponibilidad = {
        id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        dentist: { id: 1, name: 'Dr. García' },
        especialidad: { id: 1, name: 'Odontología' },
        is_active: true
      };

      mockReq.params = { id: 1 };
      Disponibilidad.findOne.mockResolvedValue(mockDisponibilidad);

      await disponibilidadController.getById(mockReq, mockRes);

      expect(Disponibilidad.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true },
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
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: mockDisponibilidad.id,
          date: mockDisponibilidad.date,
          start_time: mockDisponibilidad.start_time,
          end_time: mockDisponibilidad.end_time,
          dentist: {
            id: mockDisponibilidad.dentist.id,
            name: mockDisponibilidad.dentist.name
          },
          especialidad: {
            id: mockDisponibilidad.especialidad.id,
            name: mockDisponibilidad.especialidad.name
          }
        }
      });
    });

    it('debería retornar 404 si no encuentra la disponibilidad', async () => {
      mockReq.params = { id: 999 };
      Disponibilidad.findOne.mockResolvedValue(null);

      await disponibilidadController.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Disponibilidad no encontrada'
      });
    });
  });

  describe('create', () => {
    it('debería crear disponibilidad exitosamente', async () => {
      const newDisponibilidad = {
        dentist_id: 1,
        especialidad_id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00'
      };
      const createdDisponibilidad = { id: 3, ...newDisponibilidad, is_active: true };
      const mockDentist = { id: 1, name: 'Dr. García', role: 'dentist', status: 'active' };
      const mockEspecialidad = { id: 1, name: 'Odontología', is_active: true };

      mockReq.body = newDisponibilidad;
      User.findOne.mockResolvedValue(mockDentist);
      Especialidad.findOne.mockResolvedValue(mockEspecialidad);
      Disponibilidad.findOne.mockResolvedValue(null); // No hay conflicto de horarios
      Disponibilidad.create.mockResolvedValue(createdDisponibilidad);

      await disponibilidadController.create(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: 1, role: 'dentist', status: 'active' }
      });
      expect(Especialidad.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true }
      });
      expect(Disponibilidad.create).toHaveBeenCalledWith({
        dentist_id: newDisponibilidad.dentist_id,
        especialidad_id: newDisponibilidad.especialidad_id,
        date: newDisponibilidad.date,
        start_time: newDisponibilidad.start_time,
        end_time: newDisponibilidad.end_time,
        is_active: true
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Disponibilidad creada exitosamente',
        data: expect.objectContaining({
          id: createdDisponibilidad.id,
          dentist: {
            id: mockDentist.id,
            name: mockDentist.name
          },
          especialidad: {
            id: mockEspecialidad.id,
            name: mockEspecialidad.name
          }
        })
      });
    });

    it('debería validar campos requeridos', async () => {
      mockReq.body = { date: '2025-12-15' };

      await disponibilidadController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El dentista es requerido'
      });
    });

    it('debería validar que el dentista existe', async () => {
      mockReq.body = {
        dentist_id: 999,
        especialidad_id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00'
      };
      User.findOne.mockResolvedValue(null);

      await disponibilidadController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Dentista no encontrado'
      });
    });
  });

  describe('update', () => {
    it('debería actualizar disponibilidad exitosamente', async () => {
      const existingDisponibilidad = {
        id: 1,
        dentist_id: 1,
        especialidad_id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        is_active: true
      };
      const updateData = {
        dentist_id: 1,
        especialidad_id: 1,
        date: '2025-12-16',
        start_time: '10:00:00',
        end_time: '11:00:00'
      };

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      Disponibilidad.findOne
        .mockResolvedValueOnce(existingDisponibilidad) // Para encontrar la disponibilidad
        .mockResolvedValueOnce(null); // Para verificar que no hay conflicto
      User.findOne.mockResolvedValue({ id: 1, name: 'Dr. García', role: 'dentist', status: 'active' });
      Especialidad.findOne.mockResolvedValue({ id: 1, name: 'Odontología', is_active: true });

      existingDisponibilidad.update = jest.fn().mockResolvedValue({
        ...existingDisponibilidad,
        ...updateData
      });

      await disponibilidadController.update(mockReq, mockRes);

      expect(existingDisponibilidad.update).toHaveBeenCalledWith({
        dentist_id: updateData.dentist_id,
        especialidad_id: updateData.especialidad_id,
        date: updateData.date,
        start_time: updateData.start_time,
        end_time: updateData.end_time
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Disponibilidad actualizada exitosamente',
        data: {
          id: existingDisponibilidad.id,
          date: existingDisponibilidad.date,
          start_time: existingDisponibilidad.start_time,
          end_time: existingDisponibilidad.end_time,
          dentist: {
            id: 1,
            name: 'Dr. García'
          },
          especialidad: {
            id: 1,
            name: 'Odontología'
          }
        }
      });
    });
  });

  describe('deactivate', () => {
    it('debería desactivar disponibilidad exitosamente', async () => {
      const disponibilidad = { id: 1, is_active: true };
      mockReq.params = { id: 1 };

      Disponibilidad.findOne.mockResolvedValue(disponibilidad);
      Appointment.count.mockResolvedValue(0); // No hay citas pendientes
      disponibilidad.update = jest.fn().mockResolvedValue({ ...disponibilidad, is_active: false });

      await disponibilidadController.deactivate(mockReq, mockRes);

      expect(Appointment.count).toHaveBeenCalledWith({
        where: {
          disponibilidad_id: 1,
          status: ['pending', 'confirmed']
        }
      });
      expect(disponibilidad.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Disponibilidad desactivada exitosamente'
      });
    });

    it('debería rechazar desactivar si hay citas pendientes', async () => {
      const disponibilidad = { id: 1, is_active: true };
      mockReq.params = { id: 1 };

      Disponibilidad.findOne.mockResolvedValue(disponibilidad);
      Appointment.count.mockResolvedValue(2); // Hay citas pendientes

      await disponibilidadController.deactivate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No se puede desactivar la disponibilidad porque tiene citas pendientes o confirmadas'
      });
    });
  });
}); 