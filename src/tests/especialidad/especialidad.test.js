const especialidadController = require('../../controllers/especialidad-controller');

// Mock de los modelos
jest.mock('../../models', () => ({
  Especialidad: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

const { Especialidad } = require('../../models');

describe('Especialidad Controller', () => {
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
    it('debería listar especialidades exitosamente', async () => {
      const mockEspecialidades = [
        { id: 1, name: 'Odontología', description: 'desc1', is_active: true },
        { id: 2, name: 'Ortodoncia', description: 'desc2', is_active: true }
      ];

      Especialidad.findAll.mockResolvedValue(mockEspecialidades);

      await especialidadController.getAll(mockReq, mockRes);

      expect(Especialidad.findAll).toHaveBeenCalledWith({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'Odontología', description: 'desc1' }),
          expect.objectContaining({ id: 2, name: 'Ortodoncia', description: 'desc2' })
        ])
      }));
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('Error de base de datos');
      Especialidad.findAll.mockRejectedValue(error);

      await especialidadController.getAll(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
    });
  });

  describe('getById', () => {
    it('debería obtener especialidad por id exitosamente', async () => {
      const mockEspecialidad = { id: 1, name: 'Odontología', description: 'desc', is_active: true };
      mockReq.params = { id: 1 };

      Especialidad.findOne.mockResolvedValue(mockEspecialidad);

      await especialidadController.getById(mockReq, mockRes);

      expect(Especialidad.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true }
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 1, name: 'Odontología', description: 'desc' })
      }));
    });

    it('debería retornar 404 si no encuentra la especialidad', async () => {
      mockReq.params = { id: 999 };
      Especialidad.findOne.mockResolvedValue(null);

      await especialidadController.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Especialidad no encontrada'
      });
    });
  });

  describe('create', () => {
    it('debería crear especialidad exitosamente', async () => {
      const newEspecialidad = { name: 'Nueva Especialidad', description: 'desc' };
      const createdEspecialidad = { id: 3, ...newEspecialidad, is_active: true };
      
      mockReq.body = newEspecialidad;
      Especialidad.findOne.mockResolvedValue(null); // No existe duplicado
      Especialidad.create.mockResolvedValue(createdEspecialidad);

      await especialidadController.create(mockReq, mockRes);

      expect(Especialidad.create).toHaveBeenCalledWith({
        name: newEspecialidad.name.trim(),
        description: newEspecialidad.description,
        is_active: true
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Especialidad creada exitosamente',
        data: expect.objectContaining({ id: 3, name: 'Nueva Especialidad' })
      }));
    });

    it('debería validar nombre requerido', async () => {
      mockReq.body = { description: 'desc' };

      await especialidadController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'El nombre de la especialidad es requerido y debe tener al menos 2 caracteres'
      });
    });

    it('debería rechazar nombre duplicado', async () => {
      mockReq.body = { name: 'Especialidad Existente', description: 'desc' };
      Especialidad.findOne.mockResolvedValue({ id: 1, name: 'Especialidad Existente' });

      await especialidadController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe una especialidad con este nombre'
      });
    });
  });

  describe('update', () => {
    it('debería actualizar especialidad exitosamente', async () => {
      const existingEspecialidad = { id: 1, name: 'Vieja', description: 'desc', is_active: true };
      const updateData = { name: 'Nueva', description: 'nueva desc' };
      const updatedEspecialidad = { 
        id: 1, 
        name: 'Nueva', 
        description: 'nueva desc', 
        is_active: true 
      };
      
      mockReq.params = { id: 1 };
      mockReq.body = updateData;
      
      Especialidad.findOne
        .mockResolvedValueOnce(existingEspecialidad) // Para encontrar la especialidad
        .mockResolvedValueOnce(null); // Para verificar que no hay duplicado
      
      existingEspecialidad.update = jest.fn().mockResolvedValue(updatedEspecialidad);

      await especialidadController.update(mockReq, mockRes);

      expect(existingEspecialidad.update).toHaveBeenCalledWith({
        name: updateData.name.trim(),
        description: updateData.description
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Especialidad actualizada exitosamente',
        data: expect.objectContaining({ id: 1, name: 'Nueva' })
      }));
    });
  });

  describe('deactivate', () => {
    it('debería desactivar especialidad exitosamente', async () => {
      const especialidad = { id: 1, name: 'Test', is_active: true };
      mockReq.params = { id: 1 };
      
      Especialidad.findOne.mockResolvedValue(especialidad);
      especialidad.update = jest.fn().mockResolvedValue({ ...especialidad, is_active: false });

      await especialidadController.deactivate(mockReq, mockRes);

      expect(especialidad.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Especialidad desactivada exitosamente'
      }));
    });
  });
}); 