const serverAppointmentService = require('../../services/server-appointment-service');
const { Appointment } = require('../../models');
const { updateAppointmentStatusSchema } = require('../../dtos');

jest.mock('../../models', () => ({
  Appointment: { count: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  GuestPatient: {},
  User: {},
  Disponibilidad: {},
  ServiceType: {},
  Especialidad: {}
}));

jest.mock('../../dtos', () => ({
  updateAppointmentStatusSchema: { validate: jest.fn() }
}));

describe('serverAppointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAppointmentStats', () => {
    it('debería devolver estadísticas de citas', async () => {
      Appointment.count.mockImplementation((opts) => {
        if (!opts) return 10;
        if (opts.where.status === 'pending') return 3;
        if (opts.where.status === 'confirmed') return 5;
        if (opts.where.status === 'cancelled') return 2;
        return 0;
      });
      const result = await serverAppointmentService.getAppointmentStats();
      expect(result.success).toBe(true);
      expect(result.data.total).toBe(10);
      expect(result.data.pending).toBe(3);
      expect(result.data.confirmed).toBe(5);
      expect(result.data.cancelled).toBe(2);
    });
  });

  describe('getAllAppointments', () => {
    it('debería devolver todas las citas', async () => {
      const mockAppointments = [{ id: 1 }, { id: 2 }];
      Appointment.findAll.mockResolvedValue(mockAppointments);
      const result = await serverAppointmentService.getAllAppointments();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointments);
    });
  });

  describe('getById', () => {
    it('debería devolver una cita por ID', async () => {
      const mockAppointment = { id: 1 };
      Appointment.findByPk.mockResolvedValue(mockAppointment);
      const result = await serverAppointmentService.getById(1);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointment);
    });
    it('debería lanzar error si la cita no existe', async () => {
      Appointment.findByPk.mockResolvedValue(null);
      await expect(serverAppointmentService.getById(999)).rejects.toThrow('Cita no encontrada');
    });
  });

  describe('updateStatus', () => {
    it('debería actualizar el estado de una cita', async () => {
      updateAppointmentStatusSchema.validate.mockReturnValue({ error: null, value: { status: 'confirmed' } });
      const mockAppointment = { id: 1, update: jest.fn().mockResolvedValue(), status: 'confirmed' };
      Appointment.findByPk.mockResolvedValue(mockAppointment);
      const result = await serverAppointmentService.updateStatus(1, { status: 'confirmed' });
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(mockAppointment.update).toHaveBeenCalledWith({ status: 'confirmed' });
    });
    it('debería lanzar error si la validación falla', async () => {
      updateAppointmentStatusSchema.validate.mockReturnValue({ error: { details: [{ message: 'status requerido' }] } });
      await expect(serverAppointmentService.updateStatus(1, {})).rejects.toThrow('Datos de entrada inválidos');
    });
    it('debería lanzar error si la cita no existe', async () => {
      updateAppointmentStatusSchema.validate.mockReturnValue({ error: null, value: { status: 'confirmed' } });
      Appointment.findByPk.mockResolvedValue(null);
      await expect(serverAppointmentService.updateStatus(999, { status: 'confirmed' })).rejects.toThrow('Cita no encontrada');
    });
  });
}); 