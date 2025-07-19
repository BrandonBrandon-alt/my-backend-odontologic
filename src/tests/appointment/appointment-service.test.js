const appointmentService = require('../../services/appointment-service');
const { GuestPatient, Appointment } = require('../../models');
const { ValidationError, validateAppointmentCreation } = require('../../utils/appointment-validations');
const createGuestAppointmentSchema = require('../../dtos/create-guest-appointment-dto');

jest.mock('../../models', () => ({
  GuestPatient: { findOne: jest.fn() },
  Appointment: { create: jest.fn(), findAndCountAll: jest.fn() },
  Disponibilidad: {},
  ServiceType: {},
  Especialidad: {},
  User: {}
}));

jest.mock('../../utils/appointment-validations', () => ({
  validateAppointmentCreation: jest.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(message, statusCode = 400) {
      super(message);
      this.name = 'ValidationError';
      this.statusCode = statusCode;
    }
  }
}));

jest.mock('../../dtos/create-guest-appointment-dto', () => ({
  validate: jest.fn()
}));
jest.mock('../../dtos/create-user-appointment-dto', () => ({
  validate: jest.fn()
}));

describe('appointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuestAppointment', () => {
    it('debería crear una cita de invitado exitosamente', async () => {
      const appointmentData = {
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00',
        notes: 'Primera visita'
      };
      const mockGuestPatient = {
        id: 1,
        name: 'Juan Pérez',
        phone: '1234567890',
        email: 'juan@example.com'
      };
      const mockDisponibilidad = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        especialidad: { name: 'Odontología General' }
      };
      const mockServiceType = { id: 1, name: 'Limpieza Dental', duration: 60 };
      const mockAppointment = {
        id: 1,
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00',
        status: 'pending',
        appointment_type: 'guest',
        notes: 'Primera visita'
      };
      require('../../dtos/create-guest-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
      GuestPatient.findOne.mockResolvedValue(mockGuestPatient);
      validateAppointmentCreation.mockResolvedValue({ disponibilidad: mockDisponibilidad, serviceType: mockServiceType });
      Appointment.create.mockResolvedValue(mockAppointment);
      const result = await appointmentService.createGuestAppointment(appointmentData);
      expect(result).toEqual({
        success: true,
        message: 'Cita creada exitosamente',
        data: expect.objectContaining({
          id: 1,
          guest_patient: expect.objectContaining({ id: 1 }),
          disponibilidad: expect.objectContaining({ id: 1 }),
          service_type: expect.objectContaining({ id: 1 }),
          preferred_date: '2024-01-15',
          preferred_time: '09:30:00',
          status: 'pending',
          appointment_type: 'guest',
          notes: 'Primera visita'
        })
      });
    });

    it('debería rechazar datos inválidos', async () => {
      require('../../dtos/create-guest-appointment-dto').validate.mockReturnValue({
        error: { details: [ { message: 'guest_patient_id es requerido' } ] },
        value: null
      });
      await expect(appointmentService.createGuestAppointment({})).rejects.toThrow('Datos de entrada inválidos');
    });

    it('debería rechazar si el paciente invitado no existe', async () => {
      const appointmentData = {
        guest_patient_id: 999,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00'
      };
      require('../../dtos/create-guest-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
      GuestPatient.findOne.mockResolvedValue(null);
      await expect(appointmentService.createGuestAppointment(appointmentData)).rejects.toThrow('Paciente invitado no encontrado');
    });

    it('debería manejar errores de validación específicos', async () => {
      const appointmentData = {
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00'
      };
      require('../../dtos/create-guest-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
      GuestPatient.findOne.mockResolvedValue({ id: 1 });
      validateAppointmentCreation.mockRejectedValue(new ValidationError('Disponibilidad no encontrada o inactiva', 404));
      await expect(appointmentService.createGuestAppointment(appointmentData)).rejects.toThrow('Disponibilidad no encontrada o inactiva');
    });

    it('debería manejar errores internos', async () => {
      const appointmentData = {
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00'
      };
      require('../../dtos/create-guest-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
      GuestPatient.findOne.mockRejectedValue(new Error('Error de base de datos'));
      await expect(appointmentService.createGuestAppointment(appointmentData)).rejects.toThrow('Error de base de datos');
    });

    it('debería crear cita sin notas', async () => {
      const appointmentData = {
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00'
      };
      const mockGuestPatient = {
        id: 1,
        name: 'Juan Pérez',
        phone: '1234567890',
        email: 'juan@example.com'
      };
      const mockDisponibilidad = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        especialidad: { name: 'Odontología General' }
      };
      const mockServiceType = { id: 1, name: 'Limpieza Dental', duration: 60 };
      const mockAppointment = {
        id: 1,
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00',
        status: 'pending',
        appointment_type: 'guest',
        notes: null
      };
      require('../../dtos/create-guest-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
      GuestPatient.findOne.mockResolvedValue(mockGuestPatient);
      validateAppointmentCreation.mockResolvedValue({ disponibilidad: mockDisponibilidad, serviceType: mockServiceType });
      Appointment.create.mockResolvedValue(mockAppointment);
      const result = await appointmentService.createGuestAppointment(appointmentData);
      expect(result.data.notes).toBeNull();
    });
  });
});

describe('getMyAppointments', () => {
  it('debería devolver citas paginadas y filtradas', async () => {
    const user = { id: 1 };
    const query = { page: 1, limit: 5, status: 'confirmed' };
    const mockRows = [
      { id: 1, status: 'confirmed', disponibilidad: { especialidad_id: 2, dentist_id: 3, especialidad: { name: 'Ortodoncia' } }, serviceType: { name: 'Consulta', duration: 30 } }
    ];
    require('../../models').Appointment.findAndCountAll.mockResolvedValue({ count: 1, rows: mockRows });
    const result = await appointmentService.getMyAppointments(user, query);
    expect(result.success).toBe(true);
    expect(result.data.appointments.length).toBe(1);
    expect(result.data.pagination.total).toBe(1);
    expect(result.data.pagination.page).toBe(1);
    expect(result.data.pagination.limit).toBe(5);
    expect(result.data.pagination.totalPages).toBe(1);
  });

  it('debería devolver un array vacío si no hay citas', async () => {
    const user = { id: 1 };
    const query = { page: 1, limit: 5 };
    require('../../models').Appointment.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    const result = await appointmentService.getMyAppointments(user, query);
    expect(result.success).toBe(true);
    expect(result.data.appointments).toEqual([]);
    expect(result.data.pagination.total).toBe(0);
  });

  it('debería manejar errores internos del servidor', async () => {
    const user = { id: 1 };
    const query = { page: 1, limit: 5 };
    require('../../models').Appointment.findAndCountAll.mockRejectedValue(new Error('DB error'));
    await expect(appointmentService.getMyAppointments(user, query)).rejects.toThrow('DB error');
  });

  it('debería funcionar sin filtros opcionales', async () => {
    const user = { id: 1 };
    const query = { page: 1, limit: 5 };
    const mockRows = [{ id: 2, status: 'pending', disponibilidad: { especialidad: { name: 'Ortodoncia' } }, serviceType: { name: 'Consulta', duration: 30 } }];
    require('../../models').Appointment.findAndCountAll.mockResolvedValue({ count: 1, rows: mockRows });
    const result = await appointmentService.getMyAppointments(user, query);
    expect(result.success).toBe(true);
    expect(result.data.appointments.length).toBe(1);
  });

  it('debería calcular correctamente la paginación con múltiples páginas', async () => {
    const user = { id: 1 };
    const query = { page: 2, limit: 2 };
    const mockRows = [
      { id: 3, status: 'pending', disponibilidad: { especialidad: { name: 'Ortodoncia' } }, serviceType: { name: 'Consulta', duration: 30 } },
      { id: 4, status: 'pending', disponibilidad: { especialidad: { name: 'Ortodoncia' } }, serviceType: { name: 'Consulta', duration: 30 } }
    ];
    require('../../models').Appointment.findAndCountAll.mockResolvedValue({ count: 5, rows: mockRows });
    const result = await appointmentService.getMyAppointments(user, query);
    expect(result.data.pagination.total).toBe(5);
    expect(result.data.pagination.page).toBe(2);
    expect(result.data.pagination.limit).toBe(2);
    expect(result.data.pagination.totalPages).toBe(3);
  });
});

describe('createUserAppointment', () => {
  it('debería crear una cita de usuario exitosamente', async () => {
    const appointmentData = {
      disponibilidad_id: 1,
      service_type_id: 1,
      preferred_date: '2024-01-15',
      preferred_time: '09:30:00',
      notes: 'Primera visita'
    };
    const user = { id: 10 };
    const mockDisponibilidad = {
      id: 1,
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '10:00:00',
      especialidad: { name: 'Ortodoncia' }
    };
    const mockServiceType = { id: 1, name: 'Consulta', duration: 30 };
    const mockAppointment = {
      id: 1,
      user_id: 10,
      disponibilidad_id: 1,
      service_type_id: 1,
      preferred_date: '2024-01-15',
      preferred_time: '09:30:00',
      status: 'pending',
      appointment_type: 'registered',
      notes: 'Primera visita'
    };
    require('../../dtos/create-user-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
    require('../../utils/appointment-validations').validateAppointmentCreation.mockResolvedValue({ disponibilidad: mockDisponibilidad, serviceType: mockServiceType });
    require('../../models').Appointment.create.mockResolvedValue(mockAppointment);
    const result = await appointmentService.createUserAppointment(appointmentData, user);
    expect(result).toEqual({
      success: true,
      message: 'Cita creada exitosamente',
      data: expect.objectContaining({
        id: 1,
        user_id: 10,
        disponibilidad: expect.objectContaining({ id: 1 }),
        service_type: expect.objectContaining({ id: 1 }),
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00',
        status: 'pending',
        appointment_type: 'registered',
        notes: 'Primera visita'
      })
    });
  });

  it('debería rechazar datos inválidos', async () => {
    require('../../dtos/create-user-appointment-dto').validate.mockReturnValue({
      error: { details: [ { message: 'disponibilidad_id es requerido' } ] },
      value: null
    });
    await expect(appointmentService.createUserAppointment({}, { id: 1 })).rejects.toThrow('Datos de entrada inválidos');
  });

  it('debería manejar errores de validación específicos', async () => {
    const appointmentData = {
      disponibilidad_id: 1,
      service_type_id: 1,
      preferred_date: '2024-01-15',
      preferred_time: '09:30:00'
    };
    require('../../dtos/create-user-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
    require('../../utils/appointment-validations').validateAppointmentCreation.mockRejectedValue(new ValidationError('Disponibilidad no encontrada o inactiva', 404));
    await expect(appointmentService.createUserAppointment(appointmentData, { id: 1 })).rejects.toThrow('Disponibilidad no encontrada o inactiva');
  });

  it('debería manejar errores internos', async () => {
    const appointmentData = {
      disponibilidad_id: 1,
      service_type_id: 1,
      preferred_date: '2024-01-15',
      preferred_time: '09:30:00'
    };
    require('../../dtos/create-user-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
    require('../../utils/appointment-validations').validateAppointmentCreation.mockResolvedValue({ disponibilidad: { id: 1, especialidad: { name: 'Ortodoncia' } }, serviceType: { id: 1, name: 'Consulta', duration: 30 } });
    require('../../models').Appointment.create.mockRejectedValue(new Error('Error de base de datos'));
    await expect(appointmentService.createUserAppointment(appointmentData, { id: 1 })).rejects.toThrow('Error de base de datos');
  });

  it('debería crear cita sin notas', async () => {
    const appointmentData = {
      disponibilidad_id: 1,
      service_type_id: 1,
      preferred_date: '2024-01-15',
      preferred_time: '09:30:00'
    };
    const user = { id: 10 };
    const mockDisponibilidad = {
      id: 1,
      date: '2024-01-15',
      start_time: '09:00:00',
      end_time: '10:00:00',
      especialidad: { name: 'Ortodoncia' }
    };
    const mockServiceType = { id: 1, name: 'Consulta', duration: 30 };
    const mockAppointment = {
      id: 1,
      user_id: 10,
      disponibilidad_id: 1,
      service_type_id: 1,
      preferred_date: '2024-01-15',
      preferred_time: '09:30:00',
      status: 'pending',
      appointment_type: 'registered',
      notes: null
    };
    require('../../dtos/create-user-appointment-dto').validate.mockReturnValue({ error: null, value: appointmentData });
    require('../../utils/appointment-validations').validateAppointmentCreation.mockResolvedValue({ disponibilidad: mockDisponibilidad, serviceType: mockServiceType });
    require('../../models').Appointment.create.mockResolvedValue(mockAppointment);
    const result = await appointmentService.createUserAppointment(appointmentData, user);
    expect(result.data.notes).toBeNull();
  });
}); 