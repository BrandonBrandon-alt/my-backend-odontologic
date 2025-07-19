const guestPatientService = require('../../services/guest-patient-service');
const { GuestPatient } = require('../../models');

// Mock del modelo GuestPatient
jest.mock('../../models', () => ({
  GuestPatient: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

describe('GuestPatient Service', () => {

  // ✅ SOLUCIÓN: Limpia todos los mocks antes de cada prueba para evitar interferencias.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Mock Data ---
  const mockPatientData = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    phone: '1234567890',
    is_active: true,
    // ✅ SOLUCIÓN: Añade funciones mock para poder espiarlas en las pruebas.
    update: jest.fn(),
    save: jest.fn(),
  };

  describe('create', () => {
    it('debería crear un nuevo paciente invitado', async () => {
      const input = { name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '1234567890' };
      
      // Simula que no existe un email duplicado
      GuestPatient.findOne.mockResolvedValue(null);
      // Simula el resultado de la creación
      GuestPatient.create.mockResolvedValue({ id: 1, ...input });

      const result = await guestPatientService.create(input);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Paciente invitado creado exitosamente');
      expect(result.data).toHaveProperty('id');
      expect(GuestPatient.findOne).toHaveBeenCalledWith({ where: { email: input.email } });
      expect(GuestPatient.create).toHaveBeenCalledWith(input);
    });

    it('debería rechazar crear paciente con email duplicado', async () => {
      const input = { name: 'Ana', email: 'ana@example.com', phone: '9876543210' };
      GuestPatient.findOne.mockResolvedValue({ id: 2, ...input }); // Simula que el email ya existe

      await expect(guestPatientService.create(input)).rejects.toThrow('Ya existe otro paciente con este email');
    });

    it('debería rechazar crear paciente sin nombre', async () => {
        const input = { email: 'sin.nombre@example.com', phone: '1234567890' };
        // El servicio debe arrojar el error antes de consultar la BD
        await expect(guestPatientService.create(input)).rejects.toThrow('El nombre, email y teléfono son requeridos.');
    });

    it('debería rechazar crear paciente sin teléfono', async () => {
        const input = { name: 'Sin Teléfono', email: 'sin.telefono@example.com' };
        await expect(guestPatientService.create(input)).rejects.toThrow('El nombre, email y teléfono son requeridos.');
    });
  });

  describe('getById', () => {
    it('debería obtener un paciente por ID', async () => {
      GuestPatient.findOne.mockResolvedValue(mockPatientData);
      const result = await guestPatientService.getById(1);

      expect(result).toEqual(mockPatientData);
      expect(GuestPatient.findOne).toHaveBeenCalledWith({ where: { id: 1, is_active: true } });
    });

    it('debería lanzar error si el paciente no existe', async () => {
      GuestPatient.findOne.mockResolvedValue(null);
      await expect(guestPatientService.getById(999)).rejects.toThrow('Paciente invitado no encontrado');
    });
  });

  describe('update', () => {
    const updateInput = { name: 'Juan Pérez Actualizado', email: 'juan.perez.new@example.com' };

    it('debería actualizar un paciente', async () => {
      const patientInstance = { ...mockPatientData, update: jest.fn() };
      // 1. Encuentra al paciente a actualizar
      GuestPatient.findOne.mockResolvedValueOnce(patientInstance);
      // 2. Verifica que no haya email duplicado
      GuestPatient.findOne.mockResolvedValueOnce(null);

      const result = await guestPatientService.update(1, updateInput);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Paciente invitado actualizado exitosamente');
      expect(patientInstance.update).toHaveBeenCalledWith(updateInput);
    });

    it('debería rechazar actualizar con email duplicado', async () => {
      const patientInstance = { ...mockPatientData, update: jest.fn() };
      const duplicatedPatient = { id: 2, email: updateInput.email };

      // 1. Encuentra al paciente a actualizar
      GuestPatient.findOne.mockResolvedValueOnce(patientInstance);
      // 2. Simula encontrar un email duplicado que pertenece a OTRO paciente
      GuestPatient.findOne.mockResolvedValueOnce(duplicatedPatient);

      await expect(guestPatientService.update(1, updateInput)).rejects.toThrow('Ya existe otro paciente con este email');
    });

    it('debería lanzar error si el paciente no existe', async () => {
      // ✅ SOLUCIÓN: El mock ahora se limpia por beforeEach, asegurando que esta prueba funcione.
      GuestPatient.findOne.mockResolvedValue(null);
      await expect(guestPatientService.update(999, updateInput)).rejects.toThrow('Paciente invitado no encontrado');
    });
  });

  describe('deactivate', () => {
    it('debería desactivar un paciente', async () => {
      const patientInstance = { ...mockPatientData, update: jest.fn() };
      GuestPatient.findOne.mockResolvedValue(patientInstance);

      const result = await guestPatientService.deactivate(1);
      
      // ✅ SOLUCIÓN: Ahora se verifica la llamada en el mock correctamente definido.
      expect(patientInstance.update).toHaveBeenCalledWith({ is_active: false });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Paciente invitado desactivado exitosamente');
    });

    it('debería lanzar error si el paciente no existe', async () => {
      GuestPatient.findOne.mockResolvedValue(null);
      await expect(guestPatientService.deactivate(999)).rejects.toThrow('Paciente invitado no encontrado');
    });
  });
});