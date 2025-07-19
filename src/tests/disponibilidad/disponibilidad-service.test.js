const disponibilidadService = require('../../services/disponibilidad-service');
const DisponibilidadOutputDto = require('../../dtos/disponibilidad-dto');

jest.mock('../../models', () => ({
  Disponibilidad: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
  Especialidad: {
    findOne: jest.fn(),
  },
  Appointment: {
    count: jest.fn(),
  },
}));

const { Disponibilidad, User, Especialidad, Appointment } = require('../../models');

describe('Disponibilidad Service', () => {
  beforeEach(() => {
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
          is_active: true,
          dentist: { id: 1, name: 'Dr. García' },
          especialidad: { id: 1, name: 'Odontología', is_active: true },
        },
      ];
      Disponibilidad.findAll.mockResolvedValue(mockDisponibilidades);
      const result = await disponibilidadService.getAll();
      expect(Disponibilidad.findAll).toHaveBeenCalled();
      expect(result).toEqual(DisponibilidadOutputDto.fromList(mockDisponibilidades));
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
          is_active: true,
          dentist: { id: 1, name: 'Dr. García' },
          especialidad: { id: 1, name: 'Odontología', is_active: true },
        },
      ];
      Disponibilidad.findAll.mockResolvedValue(mockDisponibilidades);
      const result = await disponibilidadService.getByEspecialidad(1);
      expect(Disponibilidad.findAll).toHaveBeenCalled();
      expect(result).toEqual(DisponibilidadOutputDto.fromList(mockDisponibilidades));
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
          is_active: true,
          dentist: { id: 1, name: 'Dr. García' },
          especialidad: { id: 1, name: 'Odontología', is_active: true },
        },
      ];
      Disponibilidad.findAll.mockResolvedValue(mockDisponibilidades);
      const result = await disponibilidadService.getByDentist(1);
      expect(Disponibilidad.findAll).toHaveBeenCalled();
      expect(result).toEqual(DisponibilidadOutputDto.fromList(mockDisponibilidades));
    });
  });

  describe('getById', () => {
    it('debería obtener disponibilidad por id exitosamente', async () => {
      const mockDisponibilidad = {
        id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        is_active: true,
        dentist: { id: 1, name: 'Dr. García' },
        especialidad: { id: 1, name: 'Odontología', is_active: true },
      };
      Disponibilidad.findOne.mockResolvedValue(mockDisponibilidad);
      const result = await disponibilidadService.getById(1);
      expect(Disponibilidad.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true },
        include: expect.any(Array),
      });
      expect(result).toEqual(new DisponibilidadOutputDto(mockDisponibilidad));
    });
    it('debería lanzar error si no encuentra disponibilidad', async () => {
      Disponibilidad.findOne.mockResolvedValue(null);
      await expect(disponibilidadService.getById(99)).rejects.toThrow('Disponibilidad no encontrada');
    });
  });

  describe('create', () => {
    it('debería crear una disponibilidad exitosamente', async () => {
      const input = {
        dentist_id: 1,
        especialidad_id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
      };
      User.findOne.mockResolvedValue({ id: 1, role: 'dentist', status: 'active', name: 'Dr. García' });
      Especialidad.findOne.mockResolvedValue({ id: 1, is_active: true, name: 'Odontología' });
      Disponibilidad.findOne.mockResolvedValue(null); // No hay conflicto
      Disponibilidad.create.mockResolvedValue({ id: 10 });
      Disponibilidad.findByPk.mockResolvedValue({
        id: 10,
        ...input,
        is_active: true,
        dentist: { id: 1, name: 'Dr. García' },
        especialidad: { id: 1, name: 'Odontología', is_active: true },
      });
      const result = await disponibilidadService.create(input);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(DisponibilidadOutputDto);
    });
    it('debería lanzar error si falta el dentista', async () => {
      await expect(disponibilidadService.create({ especialidad_id: 1, date: '2025-12-15', start_time: '09:00:00', end_time: '10:00:00' }))
        .rejects.toThrow('El dentista es requerido');
    });
    it('debería lanzar error si hay conflicto de horario', async () => {
      const input = {
        dentist_id: 1,
        especialidad_id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
      };
      User.findOne.mockResolvedValue({ id: 1, role: 'dentist', status: 'active', name: 'Dr. García' });
      Especialidad.findOne.mockResolvedValue({ id: 1, is_active: true, name: 'Odontología' });
      Disponibilidad.findOne.mockResolvedValue({ id: 99 }); // Hay conflicto
      await expect(disponibilidadService.create(input)).rejects.toThrow('Ya existe una disponibilidad que se superpone con este horario');
    });
  });

  describe('update', () => {
    it('debería actualizar una disponibilidad exitosamente', async () => {
      const input = {
        dentist_id: 1,
        especialidad_id: 1,
        date: '2025-12-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
      };
      Disponibilidad.findOne.mockResolvedValue({ id: 10, update: jest.fn().mockResolvedValue() });
      User.findOne.mockResolvedValue({ id: 1, role: 'dentist', status: 'active', name: 'Dr. García' });
      Especialidad.findOne.mockResolvedValue({ id: 1, is_active: true, name: 'Odontología' });
      Disponibilidad.findOne.mockResolvedValueOnce({ id: 10, update: jest.fn().mockResolvedValue() }); // Para buscar la disponibilidad
      Disponibilidad.findOne.mockResolvedValueOnce(null); // Para conflicto
      Disponibilidad.findByPk.mockResolvedValue({
        id: 10,
        ...input,
        is_active: true,
        dentist: { id: 1, name: 'Dr. García' },
        especialidad: { id: 1, name: 'Odontología', is_active: true },
      });
      const result = await disponibilidadService.update(10, input);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(DisponibilidadOutputDto);
    });
    it('debería lanzar error si no encuentra la disponibilidad', async () => {
      Disponibilidad.findOne.mockResolvedValue(null);
      await expect(disponibilidadService.update(99, { dentist_id: 1, especialidad_id: 1, date: '2025-12-15', start_time: '09:00:00', end_time: '10:00:00' }))
        .rejects.toThrow('Disponibilidad no encontrada');
    });
  });

  describe('deactivate', () => {
    it('debería desactivar una disponibilidad exitosamente', async () => {
      Disponibilidad.findOne.mockResolvedValue({ id: 10, is_active: true, update: jest.fn().mockResolvedValue() });
      Appointment.count.mockResolvedValue(0);
      const result = await disponibilidadService.deactivate(10);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(10);
      expect(result.data.is_active).toBe(false);
    });
    it('debería lanzar error si hay citas pendientes', async () => {
      Disponibilidad.findOne.mockResolvedValue({ id: 10, is_active: true, update: jest.fn().mockResolvedValue() });
      Appointment.count.mockResolvedValue(2);
      await expect(disponibilidadService.deactivate(10)).rejects.toThrow('No se puede desactivar la disponibilidad porque tiene citas pendientes o confirmadas');
    });
    it('debería lanzar error si no encuentra la disponibilidad', async () => {
      Disponibilidad.findOne.mockResolvedValue(null);
      await expect(disponibilidadService.deactivate(99)).rejects.toThrow('Disponibilidad no encontrada');
    });
  });
}); 