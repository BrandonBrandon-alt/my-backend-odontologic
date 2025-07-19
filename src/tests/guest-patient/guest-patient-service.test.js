// src/tests/guest-patient/guest-patient-service.test.js

const guestPatientService = require('../../services/guest-patient-service');
const { GuestPatient } = require('../../models');
const { Op } = require('sequelize'); // Importamos Op para usarlo en el mock

// Mock de todo el módulo de modelos y de Sequelize
jest.mock('../../models', () => ({
  GuestPatient: {
    create: jest.fn(),
    findOne: jest.fn(),
    // No es necesario mockear 'update' aquí porque lo haremos en la instancia
  },
}));
jest.mock('sequelize', () => ({
  Op: {
    ne: Symbol('ne'), // Mockeamos el operador 'ne'
  },
}));

describe('GuestPatient Service', () => {

  // Limpia todos los mocks antes de cada prueba para evitar interferencias
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Mock Data ---
  const mockPatient = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    phone: '1234567890',
    is_active: true,
    // Las instancias devueltas por findOne deben tener sus propios mocks de funciones
    update: jest.fn(),
    save: jest.fn(),
  };

  // ... las pruebas de 'create' y 'getById' no cambian y deberían funcionar ...
  // (Las incluyo por completitud)
  describe('create', () => {
    it('debería crear un nuevo paciente invitado', async () => {
      const input = { name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '1234567890' };
      GuestPatient.findOne.mockResolvedValue(null);
      GuestPatient.create.mockResolvedValue({ id: 1, ...input });

      const result = await guestPatientService.create(input);
      expect(result.success).toBe(true);
    });

    it('debería rechazar crear paciente con email duplicado', async () => {
      const input = { name: 'Ana', email: 'ana@example.com', phone: '9876543210' };
      GuestPatient.findOne.mockResolvedValue({ id: 2, ...input });
      await expect(guestPatientService.create(input)).rejects.toThrow('Ya existe un paciente con este email');
    });
  });

  describe('getById', () => {
    it('debería obtener un paciente por ID', async () => {
        GuestPatient.findOne.mockResolvedValue(mockPatient);
        const result = await guestPatientService.getById(1);
        expect(result.data.id).toBe(1);
    });

    it('debería lanzar error si el paciente no existe', async () => {
        GuestPatient.findOne.mockResolvedValue(null);
        await expect(guestPatientService.getById(999)).rejects.toThrow('Paciente invitado no encontrado');
    });
  });


  describe('update', () => {
    const updateInput = { name: 'Juan Pérez Actualizado', email: 'juan.new@example.com', phone: '111222333' };

    it('debería actualizar un paciente', async () => {
      // ✅ Mock mejorado: Usamos una implementación que decide qué devolver
      GuestPatient.findOne.mockImplementation(async (query) => {
        // Si está buscando al paciente por ID para actualizarlo
        if (query.where.id === 1 && !query.where.email) {
          return { ...mockPatient, update: jest.fn() }; // Devolvemos una instancia con mock de update
        }
        // Si está buscando un email duplicado (y no lo encuentra)
        if (query.where.email === updateInput.email) {
          return null;
        }
        return null;
      });

      const result = await guestPatientService.update(1, updateInput);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Paciente invitado actualizado exitosamente');
      // Verificamos que se llamó al findOne para buscar el paciente original
      expect(GuestPatient.findOne).toHaveBeenCalledWith({ where: { id: 1, is_active: true } });
    });

    it('debería rechazar actualizar con email duplicado', async () => {
      const patientInstance = { ...mockPatient, update: jest.fn() };
      const duplicatedPatient = { id: 2, email: updateInput.email };

      // ✅ Mock mejorado: Simula la lógica completa del servicio
      GuestPatient.findOne.mockImplementation(async (query) => {
        // 1. Cuando busca el paciente a actualizar por ID, lo encuentra.
        if (query.where.id === 1) {
          return patientInstance;
        }
        // 2. Cuando busca el email duplicado (con Op.ne), lo encuentra.
        if (query.where.email === updateInput.email && query.where.id[Op.ne] === 1) {
          return duplicatedPatient;
        }
        return null;
      });

      await expect(guestPatientService.update(1, updateInput)).rejects.toThrow('Ya existe otro paciente con este email');
      
      // Verificamos que se hicieron las dos llamadas a la BD correctamente
      expect(GuestPatient.findOne).toHaveBeenCalledWith({ where: { id: 1, is_active: true } });
      expect(GuestPatient.findOne).toHaveBeenCalledWith({ where: { email: updateInput.email, is_active: true, id: { [Op.ne]: 1 } } });
    });

    it('debería lanzar error si el paciente no existe', async () => {
      GuestPatient.findOne.mockResolvedValue(null);
      await expect(guestPatientService.update(999, updateInput)).rejects.toThrow('Paciente invitado no encontrado');
    });
  });

  describe('deactivate', () => {
    it('debería desactivar un paciente', async () => {
      const patientInstance = { ...mockPatient, update: jest.fn() }; // Instancia con mock de update
      GuestPatient.findOne.mockResolvedValue(patientInstance);

      const result = await guestPatientService.deactivate(1);

      expect(patientInstance.update).toHaveBeenCalledWith({ is_active: false });
      expect(result.success).toBe(true);
    });

    it('debería lanzar error si el paciente no existe', async () => {
      GuestPatient.findOne.mockResolvedValue(null);
      await expect(guestPatientService.deactivate(999)).rejects.toThrow('Paciente invitado no encontrado');
    });
  });
});