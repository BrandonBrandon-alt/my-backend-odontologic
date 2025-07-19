const especialidadService = require('../../services/especialidad-service');
const EspecialidadOutputDto = require('../../dtos/especialidad-dto');

jest.mock('../../models', () => ({
  Especialidad: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const { Especialidad } = require('../../models');

describe('Especialidad Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debería listar especialidades exitosamente', async () => {
      const mockEspecialidades = [
        { id: 1, name: 'Odontología', description: 'desc1', is_active: true },
        { id: 2, name: 'Ortodoncia', description: 'desc2', is_active: true },
      ];
      Especialidad.findAll.mockResolvedValue(mockEspecialidades);
      const result = await especialidadService.getAll();
      expect(Especialidad.findAll).toHaveBeenCalledWith({
        where: { is_active: true },
        order: [['name', 'ASC']],
      });
      expect(result).toEqual(EspecialidadOutputDto.fromList(mockEspecialidades));
    });
  });

  describe('getById', () => {
    it('debería obtener especialidad por id exitosamente', async () => {
      const mockEspecialidad = { id: 1, name: 'Odontología', description: 'desc', is_active: true };
      Especialidad.findOne.mockResolvedValue(mockEspecialidad);
      const result = await especialidadService.getById(1);
      expect(Especialidad.findOne).toHaveBeenCalledWith({ where: { id: 1, is_active: true } });
      expect(result).toEqual(new EspecialidadOutputDto(mockEspecialidad));
    });
    it('debería lanzar error si no encuentra la especialidad', async () => {
      Especialidad.findOne.mockResolvedValue(null);
      await expect(especialidadService.getById(99)).rejects.toThrow('Especialidad no encontrada');
    });
  });

  describe('create', () => {
    it('debería crear especialidad exitosamente', async () => {
      const input = { name: 'Nueva Especialidad', description: 'desc' };
      const createdEspecialidad = { id: 3, ...input, is_active: true };
      Especialidad.findOne.mockResolvedValue(null); // No existe duplicado
      Especialidad.create.mockResolvedValue(createdEspecialidad);
      const result = await especialidadService.create(input);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(EspecialidadOutputDto);
    });
    it('debería lanzar error si falta el nombre', async () => {
      await expect(especialidadService.create({ description: 'desc' }))
        .rejects.toThrow('El nombre de la especialidad es requerido y debe tener al menos 2 caracteres');
    });
    it('debería lanzar error si el nombre está duplicado', async () => {
      Especialidad.findOne.mockResolvedValue({ id: 1, name: 'Existente' });
      await expect(especialidadService.create({ name: 'Existente', description: 'desc' }))
        .rejects.toThrow('Ya existe una especialidad con este nombre');
    });
  });

  describe('update', () => {
    it('debería actualizar especialidad exitosamente', async () => {
      const existingEspecialidad = { id: 1, name: 'Vieja', description: 'desc', is_active: true, update: jest.fn() };
      const updateData = { name: 'Nueva', description: 'nueva desc' };
      const updatedEspecialidad = { id: 1, name: 'Nueva', description: 'nueva desc', is_active: true };
      Especialidad.findOne
        .mockResolvedValueOnce(existingEspecialidad) // Para encontrar la especialidad
        .mockResolvedValueOnce(null); // Para verificar que no hay duplicado
      existingEspecialidad.update.mockResolvedValue(updatedEspecialidad);
      const result = await especialidadService.update(1, updateData);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(EspecialidadOutputDto);
    });
    it('debería lanzar error si no encuentra la especialidad', async () => {
      Especialidad.findOne.mockResolvedValue(null);
      await expect(especialidadService.update(99, { name: 'Nueva', description: 'desc' }))
        .rejects.toThrow('Especialidad no encontrada');
    });
    it('debería lanzar error si el nombre está duplicado', async () => {
      const existingEspecialidad = { id: 1, name: 'Vieja', description: 'desc', is_active: true, update: jest.fn() };
      Especialidad.findOne
        .mockResolvedValueOnce(existingEspecialidad)
        .mockResolvedValueOnce({ id: 2, name: 'Duplicada' });
      await expect(especialidadService.update(1, { name: 'Duplicada', description: 'desc' }))
        .rejects.toThrow('Ya existe otra especialidad con este nombre');
    });
  });

  describe('deactivate', () => {
    it('debería desactivar especialidad exitosamente', async () => {
      const especialidad = { id: 1, name: 'Test', is_active: true, update: jest.fn() };
      Especialidad.findOne.mockResolvedValue(especialidad);
      especialidad.update.mockResolvedValue({ ...especialidad, is_active: false });
      const result = await especialidadService.deactivate(1);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.is_active).toBe(false);
    });
    it('debería lanzar error si no encuentra la especialidad', async () => {
      Especialidad.findOne.mockResolvedValue(null);
      await expect(especialidadService.deactivate(99)).rejects.toThrow('Especialidad no encontrada');
    });
  });
}); 