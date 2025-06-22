const appointmentController = require('../../controllers/appointment-controller');
const { GuestPatient, Disponibilidad, ServiceType, Especialidad, User, Appointment } = require('../../models');

// Mock de los modelos
jest.mock('../../models', () => ({
  GuestPatient: {
    findByPk: jest.fn()
  },
  Disponibilidad: {
    findOne: jest.fn()
  },
  ServiceType: {
    findOne: jest.fn()
  },
  Especialidad: {
    findOne: jest.fn()
  },
  User: {
    findOne: jest.fn()
  },
  Appointment: {
    create: jest.fn(),
    findOne: jest.fn()
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

const { validateAppointmentCreation, ValidationError } = require('../../utils/appointment-validations');
const { createGuestAppointmentSchema } = require('../../dtos');

describe('Guest Appointment Service', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
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
        especialidad: {
          name: 'Odontología General'
        }
      };

      const mockServiceType = {
        id: 1,
        name: 'Limpieza Dental',
        duration: 60
      };

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

      mockReq.body = appointmentData;

      // Mock de validaciones
      createGuestAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: appointmentData
      });

      GuestPatient.findByPk.mockResolvedValue(mockGuestPatient);
      validateAppointmentCreation.mockResolvedValue({
        disponibilidad: mockDisponibilidad,
        serviceType: mockServiceType
      });
      Appointment.create.mockResolvedValue(mockAppointment);

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(createGuestAppointmentSchema.validate).toHaveBeenCalledWith(appointmentData);
      expect(GuestPatient.findByPk).toHaveBeenCalledWith(1);
      expect(validateAppointmentCreation).toHaveBeenCalledWith(
        1, 1, '2024-01-15', '09:30:00'
      );
      expect(Appointment.create).toHaveBeenCalledWith({
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00',
        status: 'pending',
        appointment_type: 'guest',
        notes: 'Primera visita'
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cita creada exitosamente',
        data: {
          id: 1,
          guest_patient: {
            id: 1,
            name: 'Juan Pérez',
            phone: '1234567890',
            email: 'juan@example.com'
          },
          disponibilidad: {
            id: 1,
            date: '2024-01-15',
            start_time: '09:00:00',
            end_time: '10:00:00',
            especialidad: 'Odontología General'
          },
          service_type: {
            id: 1,
            name: 'Limpieza Dental',
            duration: 60
          },
          preferred_date: '2024-01-15',
          preferred_time: '09:30:00',
          status: 'pending',
          appointment_type: 'guest',
          notes: 'Primera visita'
        }
      });
    });

    it('debería rechazar datos inválidos', async () => {
      const invalidData = {};

      mockReq.body = invalidData;

      createGuestAppointmentSchema.validate.mockReturnValue({
        error: {
          details: [
            { message: 'guest_patient_id es requerido' },
            { message: 'disponibilidad_id es requerido' }
          ]
        },
        value: null
      });

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: [
          'guest_patient_id es requerido',
          'disponibilidad_id es requerido'
        ]
      });
    });

    it('debería rechazar si el paciente invitado no existe', async () => {
      const appointmentData = {
        guest_patient_id: 999,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00'
      };

      mockReq.body = appointmentData;

      createGuestAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: appointmentData
      });

      GuestPatient.findByPk.mockResolvedValue(null);

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Paciente invitado no encontrado'
      });
    });

    it('debería manejar errores de validación específicos', async () => {
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

      mockReq.body = appointmentData;

      createGuestAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: appointmentData
      });

      GuestPatient.findByPk.mockResolvedValue(mockGuestPatient);
      validateAppointmentCreation.mockRejectedValue(
        new ValidationError('Disponibilidad no encontrada o inactiva', 404)
      );

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Disponibilidad no encontrada o inactiva'
      });
    });

    it('debería manejar errores internos', async () => {
      const appointmentData = {
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00'
      };

      mockReq.body = appointmentData;

      createGuestAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: appointmentData
      });

      GuestPatient.findByPk.mockRejectedValue(new Error('Error de base de datos'));

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor'
      });
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
        especialidad: {
          name: 'Odontología General'
        }
      };

      const mockServiceType = {
        id: 1,
        name: 'Limpieza Dental',
        duration: 60
      };

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

      mockReq.body = appointmentData;

      createGuestAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: appointmentData
      });

      GuestPatient.findByPk.mockResolvedValue(mockGuestPatient);
      validateAppointmentCreation.mockResolvedValue({
        disponibilidad: mockDisponibilidad,
        serviceType: mockServiceType
      });
      Appointment.create.mockResolvedValue(mockAppointment);

      await appointmentController.createGuestAppointment(mockReq, mockRes);

      expect(Appointment.create).toHaveBeenCalledWith({
        guest_patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: '2024-01-15',
        preferred_time: '09:30:00',
        status: 'pending',
        appointment_type: 'guest',
        notes: null
      });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notes: null
          })
        })
      );
    });
  });
}); 