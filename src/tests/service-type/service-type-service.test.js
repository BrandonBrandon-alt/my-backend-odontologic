const serviceTypeService = require('../../services/service-type-service');
const ServiceTypeOutputDto = require('../../dtos/serviceType-dto');

jest.mock('../../models', () => ({
  ServiceType: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
  },
  Specialty: {
    findOne: jest.fn(),
  },
}));

const { ServiceType, Specialty } = require('../../models');

describe('ServiceType Service', () => {
  beforeEach(() => {
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
          specialty: { id: 1, name: 'Odontología', description: 'desc', is_active: true },
          is_active: true
        },
      ];
      ServiceType.findAll.mockResolvedValue(mockServiceTypes);
      const result = await serviceTypeService.getAll();
      expect(ServiceType.findAll).toHaveBeenCalled();
      expect(result).toEqual(ServiceTypeOutputDto.fromList(mockServiceTypes));
    });
  });

  describe('getBySpecialty', () => {
    it('debería obtener tipos de servicio por especialidad', async () => {
      const mockServiceTypes = [
        {
          id: 1,
          name: 'Limpieza',
          duration: 30,
          specialty: { id: 1, name: 'Odontología', description: 'desc', is_active: true },
          is_active: true
        },
      ];
      ServiceType.findAll.mockResolvedValue(mockServiceTypes);
      const result = await serviceTypeService.getBySpecialty(1);
      expect(ServiceType.findAll).toHaveBeenCalled();
      expect(result).toEqual(ServiceTypeOutputDto.fromList(mockServiceTypes));
    });
  });

  describe('getById', () => {
    it('debería obtener tipo de servicio por id exitosamente', async () => {
      const mockServiceType = {
        id: 1,
        name: 'Limpieza',
        description: 'desc',
        duration: 30,
        specialty: { id: 1, name: 'Odontología', description: 'desc', is_active: true },
        is_active: true
      };
      ServiceType.findOne.mockResolvedValue(mockServiceType);
      const result = await serviceTypeService.getById(1);
      expect(ServiceType.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true },
        include: expect.any(Array),
      });
      expect(result).toEqual(new ServiceTypeOutputDto(mockServiceType));
    });
    it('debería lanzar error si no encuentra el tipo de servicio', async () => {
      ServiceType.findOne.mockResolvedValue(null);
      await expect(serviceTypeService.getById(99)).rejects.toThrow('Service type not found');
    });
  });

  describe('create', () => {
    it('debería crear tipo de servicio exitosamente', async () => {
      const input = { name: 'Nuevo Servicio', description: 'desc', duration: 30, specialty_id: 1 };
      Specialty.findOne.mockResolvedValue({ id: 1, name: 'Odontología', is_active: true });
      ServiceType.findOne.mockResolvedValue(null); // No existe duplicado
      ServiceType.create.mockResolvedValue({ id: 10 });
      ServiceType.findByPk.mockResolvedValue({
        id: 10,
        ...input,
        is_active: true,
        specialty: { id: 1, name: 'Odontología', description: 'desc', is_active: true },
      });
      const result = await serviceTypeService.create(input);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(ServiceTypeOutputDto);
    });
    it('debería lanzar error si falta el nombre', async () => {
      await expect(serviceTypeService.create({ duration: 30, specialty_id: 1 }))
        .rejects.toThrow('The service type name is required and must be at least 2 characters');
    });
    it('debería lanzar error si el nombre está duplicado', async () => {
      Specialty.findOne.mockResolvedValue({ id: 1, name: 'Odontología', is_active: true });
      ServiceType.findOne.mockResolvedValue({ id: 1, name: 'Existente' });
      await expect(serviceTypeService.create({ name: 'Existente', duration: 30, specialty_id: 1 }))
        .rejects.toThrow('A service type with this name already exists in this specialty');
    });
  });

  describe('update', () => {
    it('debería actualizar tipo de servicio exitosamente', async () => {
      const existingServiceType = { id: 1, name: 'Viejo', duration: 30, specialty_id: 1, is_active: true, update: jest.fn() };
      const updateData = { name: 'Nuevo', description: 'nueva desc', duration: 45, specialty_id: 1 };
      const updatedServiceType = { id: 1, name: 'Nuevo', description: 'nueva desc', duration: 45, specialty_id: 1, is_active: true, specialty: { id: 1, name: 'Odontología', description: 'desc', is_active: true } };
      ServiceType.findOne
        .mockResolvedValueOnce(existingServiceType) // Para encontrar el tipo de servicio
        .mockResolvedValueOnce(null); // Para verificar que no hay duplicado
      Specialty.findOne.mockResolvedValue({ id: 1, name: 'Odontología', is_active: true });
      existingServiceType.update.mockResolvedValue(updatedServiceType);
      ServiceType.findByPk.mockResolvedValue(updatedServiceType);
      const result = await serviceTypeService.update(1, updateData);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(ServiceTypeOutputDto);
    });
    it('debería lanzar error si no encuentra el tipo de servicio', async () => {
      ServiceType.findOne.mockResolvedValue(null);
      await expect(serviceTypeService.update(99, { name: 'Nuevo', duration: 30, specialty_id: 1 }))
        .rejects.toThrow('Service type not found');
    });
    it('debería lanzar error si el nombre está duplicado', async () => {
      const existingServiceType = { id: 1, name: 'Viejo', duration: 30, specialty_id: 1, is_active: true, update: jest.fn() };
      ServiceType.findOne
        .mockResolvedValueOnce(existingServiceType)
        .mockResolvedValueOnce({ id: 2, name: 'Duplicado' });
      Specialty.findOne.mockResolvedValue({ id: 1, name: 'Odontología', is_active: true });
      await expect(serviceTypeService.update(1, { name: 'Duplicado', duration: 30, specialty_id: 1 }))
        .rejects.toThrow('A service type with this name already exists in this specialty');
    });
  });

  describe('deactivate', () => {
    it('debería desactivar tipo de servicio exitosamente', async () => {
      const serviceType = { id: 1, name: 'Test', is_active: true, update: jest.fn() };
      ServiceType.findOne.mockResolvedValue(serviceType);
      serviceType.update.mockResolvedValue({ ...serviceType, is_active: false });
      const result = await serviceTypeService.deactivate(1);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.is_active).toBe(false);
    });
    it('debería lanzar error si no encuentra el tipo de servicio', async () => {
      ServiceType.findOne.mockResolvedValue(null);
      await expect(serviceTypeService.deactivate(99)).rejects.toThrow('Service type not found');
    });
  });
}); 