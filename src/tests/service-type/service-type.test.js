const serviceTypeController = require('../../controllers/service-type-controller');

// Mock de los modelos
jest.mock('../../models', () => ({
  ServiceType: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Especialidad: {
    findOne: jest.fn()
  }
}));

const { ServiceType, Especialidad } = require('../../models');

describe('ServiceType Controller', () => {
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
    it('debería listar tipos de servicio exitosamente', async () => {
      const mockServiceTypes = [
        {
          id: 1,
          name: 'Limpieza',
          description: 'desc1',
          duration: 30,
          especialidad: { id: 1, name: 'Odontología' }
        },
        {
          id: 2,
          name: 'Extracción',
          description: 'desc2',
          duration: 45,
          especialidad: { id: 1, name: 'Odontología' }
        }
      ];

      ServiceType.findAll.mockResolvedValue(mockServiceTypes);

      await serviceTypeController.getAll(mockReq, mockRes);

      expect(ServiceType.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ is_active: true }),
        include: [expect.objectContaining({
          model: expect.anything(),
          as: 'especialidad',
          where: expect.objectContaining({ is_active: true }),
          attributes: expect.arrayContaining(['id', 'name'])
        })],
        order: expect.any(Array)
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });
  });

  describe('getByEspecialidad', () => {
    it('debería obtener tipos de servicio por especialidad', async () => {
      const mockServiceTypes = [
        {
          id: 1,
          name: 'Limpieza',
          duration: 30,
          especialidad: { id: 1, name: 'Odontología' }
        }
      ];

      mockReq.params = { especialidad_id: 1 };
      ServiceType.findAll.mockResolvedValue(mockServiceTypes);

      await serviceTypeController.getByEspecialidad(mockReq, mockRes);

      expect(ServiceType.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ especialidad_id: 1, is_active: true }),
        include: [expect.objectContaining({
          model: expect.anything(),
          as: 'especialidad',
          where: expect.objectContaining({ is_active: true }),
          attributes: expect.arrayContaining(['id', 'name'])
        })]
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });
  });

  describe('getById', () => {
    it('debería obtener tipo de servicio por id exitosamente', async () => {
      const mockServiceType = {
        id: 1,
        name: 'Limpieza',
        description: 'desc',
        duration: 30,
        especialidad: { id: 1, name: 'Odontología' },
        is_active: true
      };

      mockReq.params = { id: 1 };
      ServiceType.findOne.mockResolvedValue(mockServiceType);

      await serviceTypeController.getById(mockReq, mockRes);

      expect(ServiceType.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ id: 1, is_active: true }),
        include: [expect.objectContaining({
          as: 'especialidad',
          attributes: expect.arrayContaining(['id', 'name'])
        })]
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: mockServiceType.id,
          name: mockServiceType.name
        })
      }));
    });
  });

  describe('create', () => {
    it('debería crear tipo de servicio exitosamente', async () => {
      const newServiceType = {
        name: 'Nuevo Servicio',
        description: 'desc',
        duration: 30,
        especialidad_id: 1
      };
      const createdServiceType = { id: 3, ...newServiceType, is_active: true };
      const mockEspecialidad = { id: 1, name: 'Odontología' };

      mockReq.body = newServiceType;
      Especialidad.findOne.mockResolvedValue(mockEspecialidad);
      ServiceType.findOne.mockResolvedValue(null); // No existe duplicado
      ServiceType.create.mockResolvedValue(createdServiceType);
      ServiceType.findByPk.mockResolvedValue({ ...createdServiceType, especialidad: mockEspecialidad });

      await serviceTypeController.create(mockReq, mockRes);

      expect(Especialidad.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true }
      });
      expect(ServiceType.create).toHaveBeenCalledWith({
        name: newServiceType.name.trim(),
        description: newServiceType.description,
        duration: parseInt(newServiceType.duration),
        especialidad_id: newServiceType.especialidad_id,
        is_active: true
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Tipo de servicio creado exitosamente',
        data: expect.any(Object)
      }));
    });
  });

  describe('update', () => {
    it('debería actualizar tipo de servicio exitosamente', async () => {
      const existingServiceType = {
        id: 1,
        name: 'Viejo Servicio',
        duration: 30,
        especialidad_id: 1,
        is_active: true
      };
      const updateData = {
        name: 'Nuevo Servicio',
        duration: 45,
        especialidad_id: 1
      };

      mockReq.params = { id: 1 };
      mockReq.body = updateData;

      ServiceType.findOne
        .mockResolvedValueOnce(existingServiceType) // Para encontrar el servicio
        .mockResolvedValueOnce(null); // Para verificar que no hay duplicado
      Especialidad.findOne.mockResolvedValue({ id: 1, name: 'Odontología' });

      existingServiceType.update = jest.fn().mockResolvedValue({
        ...existingServiceType,
        ...updateData
      });

      ServiceType.findByPk.mockResolvedValue({
        ...existingServiceType,
        ...updateData,
        especialidad: { id: 1, name: 'Odontología' }
      });

      await serviceTypeController.update(mockReq, mockRes);

      expect(existingServiceType.update).toHaveBeenCalledWith({
        name: updateData.name.trim(),
        description: null,
        duration: parseInt(updateData.duration),
        especialidad_id: updateData.especialidad_id
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Tipo de servicio actualizado exitosamente',
        data: expect.any(Object)
      }));
    });
  });

  describe('deactivate', () => {
    it('debería desactivar tipo de servicio exitosamente', async () => {
      const serviceType = { id: 1, name: 'Test', is_active: true };
      mockReq.params = { id: 1 };

      ServiceType.findOne.mockResolvedValue(serviceType);
      serviceType.update = jest.fn().mockResolvedValue({ ...serviceType, is_active: false });

      await serviceTypeController.deactivate(mockReq, mockRes);

      expect(serviceType.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Tipo de servicio desactivado exitosamente'
      }));
    });
  });
}); 