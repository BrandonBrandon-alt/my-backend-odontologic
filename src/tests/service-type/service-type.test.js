const serviceTypeController = require('../../controllers/service-type-controller');

// Mock de los modelos
jest.mock('../../models', () => ({
  ServiceType: {
    findAll: jest.fn(),
    findOne: jest.fn(),
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
          price: 50.00,
          especialidad: { id: 1, name: 'Odontología' }
        },
        {
          id: 2,
          name: 'Extracción',
          description: 'desc2',
          duration: 45,
          price: 80.00,
          especialidad: { id: 1, name: 'Odontología' }
        }
      ];

      ServiceType.findAll.mockResolvedValue(mockServiceTypes);

      await serviceTypeController.getAll(mockReq, mockRes);

      expect(ServiceType.findAll).toHaveBeenCalledWith({
        where: { is_active: true },
        include: [{
          model: Especialidad,
          as: 'especialidad',
          where: { is_active: true },
          attributes: ['id', 'name']
        }],
        order: [['name', 'ASC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockServiceTypes.map(st => ({
          id: st.id,
          name: st.name,
          description: st.description,
          duration: st.duration,
          price: st.price,
          especialidad: {
            id: st.especialidad.id,
            name: st.especialidad.name
          }
        }))
      });
    });
  });

  describe('getByEspecialidad', () => {
    it('debería obtener tipos de servicio por especialidad', async () => {
      const mockServiceTypes = [
        {
          id: 1,
          name: 'Limpieza',
          duration: 30,
          price: 50.00,
          especialidad: { id: 1, name: 'Odontología' }
        }
      ];

      mockReq.params = { especialidad_id: 1 };
      ServiceType.findAll.mockResolvedValue(mockServiceTypes);

      await serviceTypeController.getByEspecialidad(mockReq, mockRes);

      expect(ServiceType.findAll).toHaveBeenCalledWith({
        where: { especialidad_id: 1, is_active: true },
        include: [{
          model: Especialidad,
          as: 'especialidad',
          where: { is_active: true },
          attributes: ['id', 'name']
        }],
        order: [['name', 'ASC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('getById', () => {
    it('debería obtener tipo de servicio por id exitosamente', async () => {
      const mockServiceType = {
        id: 1,
        name: 'Limpieza',
        description: 'desc',
        duration: 30,
        price: 50.00,
        especialidad: { id: 1, name: 'Odontología' },
        is_active: true
      };

      mockReq.params = { id: 1 };
      ServiceType.findOne.mockResolvedValue(mockServiceType);

      await serviceTypeController.getById(mockReq, mockRes);

      expect(ServiceType.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true },
        include: [{
          model: Especialidad,
          as: 'especialidad',
          where: { is_active: true },
          attributes: ['id', 'name']
        }]
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: mockServiceType.id,
          name: mockServiceType.name,
          description: mockServiceType.description,
          duration: mockServiceType.duration,
          price: mockServiceType.price,
          especialidad: {
            id: mockServiceType.especialidad.id,
            name: mockServiceType.especialidad.name
          }
        }
      });
    });

    it('debería retornar 404 si no encuentra el tipo de servicio', async () => {
      mockReq.params = { id: 999 };
      ServiceType.findOne.mockResolvedValue(null);

      await serviceTypeController.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tipo de servicio no encontrado'
      });
    });
  });

  describe('create', () => {
    it('debería crear tipo de servicio exitosamente', async () => {
      const newServiceType = {
        name: 'Nuevo Servicio',
        description: 'desc',
        duration: 30,
        price: 100,
        especialidad_id: 1
      };
      const createdServiceType = { id: 3, ...newServiceType, is_active: true };
      const mockEspecialidad = { id: 1, name: 'Odontología' };

      mockReq.body = newServiceType;
      Especialidad.findOne.mockResolvedValue(mockEspecialidad);
      ServiceType.findOne.mockResolvedValue(null); // No existe duplicado
      ServiceType.create.mockResolvedValue(createdServiceType);

      await serviceTypeController.create(mockReq, mockRes);

      expect(Especialidad.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true }
      });
      expect(ServiceType.create).toHaveBeenCalledWith({
        name: newServiceType.name.trim(),
        description: newServiceType.description,
        duration: parseInt(newServiceType.duration),
        price: parseFloat(newServiceType.price),
        especialidad_id: newServiceType.especialidad_id,
        is_active: true
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tipo de servicio creado exitosamente',
        data: expect.objectContaining({
          id: createdServiceType.id,
          name: createdServiceType.name
        })
      });
    });

    it('debería validar campos requeridos', async () => {
      mockReq.body = { description: 'desc' };

      await serviceTypeController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre del servicio es requerido y debe tener al menos 2 caracteres'
      });
    });

    it('debería validar que la especialidad existe', async () => {
      mockReq.body = {
        name: 'Servicio',
        duration: 30,
        price: 100,
        especialidad_id: 999
      };
      Especialidad.findOne.mockResolvedValue(null);

      await serviceTypeController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Especialidad no encontrada'
      });
    });
  });

  describe('update', () => {
    it('debería actualizar tipo de servicio exitosamente', async () => {
      const existingServiceType = {
        id: 1,
        name: 'Viejo Servicio',
        duration: 30,
        price: 50,
        especialidad_id: 1,
        is_active: true
      };
      const updateData = {
        name: 'Nuevo Servicio',
        duration: 45,
        price: 75,
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

      await serviceTypeController.update(mockReq, mockRes);

      expect(existingServiceType.update).toHaveBeenCalledWith({
        name: updateData.name.trim(),
        description: null,
        duration: parseInt(updateData.duration),
        price: parseFloat(updateData.price),
        especialidad_id: updateData.especialidad_id
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tipo de servicio actualizado exitosamente',
        data: expect.objectContaining({
          name: updateData.name
        })
      });
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
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tipo de servicio desactivado exitosamente'
      });
    });
  });
}); 