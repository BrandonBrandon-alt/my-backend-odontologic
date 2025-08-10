const appointmentController = require('../../controllers/appointment-controller');
const { GuestPatient, Disponibilidad, ServiceType, Especialidad, User, Appointment } = require('../../models');

jest.mock('../../controllers/auth-controller', () => ({
  ...jest.requireActual('../../controllers/auth-controller'),
  verifyRecaptcha: jest.fn().mockResolvedValue({ success: true, score: 0.9 })
}));

// Mock de los modelos
jest.mock('../../models', () => ({
  GuestPatient: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Disponibilidad: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  ServiceType: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  Especialidad: {
    findOne: jest.fn()
  },
  User: {
    findOne: jest.fn()
  },
  Appointment: {
    sequelize: { transaction: jest.fn() },
    create: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn()
  }
}));

// Mock de las utilidades de validación
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

// Mock de los DTOs
jest.mock('../../dtos', () => ({
  createGuestAppointmentSchema: {
    validate: jest.fn()
  }
}));

const { createGuestAppointmentSchema } = require('../../dtos');
const { validateAppointmentCreation } = require('../../utils/appointment-validations');

describe('Guest Appointment Service', () => {
  let mockReq, mockRes, mockTransaction;

  beforeEach(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    mockReq = {
      body: {
        guest_patient: { name: 'Juan Pérez', email: 'juan@example.com', phone: '+573001234567' },
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: dateStr,
        notes: 'Primera visita',
        captchaToken: 'test'
      }
    };
    mockRes = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    Appointment.sequelize.transaction.mockResolvedValue(mockTransaction);
    jest.clearAllMocks();
  });

  describe('createGuestAppointment', () => {
    it('debería crear una cita de invitado exitosamente', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const mockGuestPatient = { id: 1, name: 'Juan Pérez', phone: '+573001234567', email: 'juan@example.com', is_active: true };
      const mockDisponibilidad = { id: 1, date: dateStr, start_time: '09:00:00', end_time: '10:00:00', especialidad_id: 1, especialidad: { name: 'Odontología General' }, dentist: { id: 1, name: 'Dr. Test' } };
      const mockServiceType = { id: 1, name: 'Limpieza Dental', duration: 60, especialidad_id: 1 };
      const mockAppointment = { id: 1 };

      createGuestAppointmentSchema.validate.mockReturnValue({ error: null, value: mockReq.body });
      GuestPatient.findOne.mockResolvedValue(null);
      GuestPatient.create.mockResolvedValue(mockGuestPatient);
      Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
      Appointment.findOne.mockResolvedValue(null);
      ServiceType.findByPk.mockResolvedValue(mockServiceType);
      Appointment.count.mockResolvedValue(0);
      Appointment.create.mockResolvedValue(mockAppointment);

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(Appointment.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
}); 