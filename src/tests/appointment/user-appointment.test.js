// Mock de los modelos y dependencias primero
jest.mock('../../models', () => ({
  Appointment: {
    sequelize: {
      transaction: jest.fn()
    },
    create: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  },
  Disponibilidad: {
    findByPk: jest.fn()
  },
  ServiceType: {
    findByPk: jest.fn()
  },
  Especialidad: {
    create: jest.fn(),
    findByPk: jest.fn()
  }
}));

// Mock de Joi DTO
jest.mock('../../dtos', () => ({
  createUserAppointmentSchema: {
    validate: jest.fn()
  }
}));

// Mock mailer
jest.mock('../../utils/mailer', () => ({
  sendAppointmentConfirmationEmail: jest.fn()
}));

const { Appointment, User, Disponibilidad, ServiceType } = require('../../models');
const { createUserAppointmentSchema } = require('../../dtos');
const { sendAppointmentConfirmationEmail } = require('../../utils/mailer');

const appointmentController = require('../../controllers/appointment-controller');

describe('Appointment Controller - createUserAppointment', () => {
  let mockReq, mockRes, mockTransaction;

  beforeEach(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    mockReq = {
      user: { id: 1, email: 'test@example.com', role: 'user' },
      body: {
        patient_id: 1,
        disponibilidad_id: 1,
        service_type_id: 1,
        preferred_date: tomorrowStr,
        notes: 'Notas de prueba'
      }
    };
    mockRes = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    jest.clearAllMocks();
    Appointment.sequelize.transaction.mockResolvedValue(mockTransaction);
    // Valor por defecto para evitar fallos de destructuring
    createUserAppointmentSchema.validate.mockReturnValue({ error: null, value: mockReq.body });
  });

  describe('Validaciones de autenticación', () => {
    test('debe rechazar cuando no hay usuario autenticado', async () => {
      mockReq.user = null;

      await appointmentController.createUserAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error interno del servidor'
      });
    });
  });

  describe('Validaciones de datos', () => {
    test('debe rechazar datos faltantes', async () => {
      const validationError = {
        details: [
          { message: 'El ID del paciente es requerido' },
          { message: 'El ID de disponibilidad es requerido' }
        ]
      };

      createUserAppointmentSchema.validate.mockReturnValue({
        error: validationError,
        value: null
      });

      await appointmentController.createUserAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: ['El ID del paciente es requerido', 'El ID de disponibilidad es requerido']
      });
    });

          test('debe rechazar fecha pasada', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: yesterdayStr,
            notes: 'Notas de prueba'
          }
        });

        // Mock del paciente para que pase la validación de autorización
        User.findByPk.mockResolvedValue({ id: 1, name: 'Test User' });

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'La fecha debe ser futura'
        });
      });
  });

  describe('Validaciones de autorización', () => {
    test('debe rechazar cuando patient_id no coincide con usuario autenticado', async () => {
      createUserAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: {
          patient_id: 999, // ID diferente al usuario autenticado
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: '2024-12-25',
          notes: 'Notas de prueba'
        }
      });

      await appointmentController.createUserAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado para crear citas para otros pacientes'
      });
    });
  });

  describe('Validaciones de negocio', () => {
    test('debe rechazar paciente inexistente', async () => {
      createUserAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: {
          patient_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: '2024-12-25',
          notes: 'Notas de prueba'
        }
      });

      User.findByPk.mockResolvedValue(null);

      await appointmentController.createUserAppointment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Paciente no encontrado'
      });
    });

          test('debe rechazar disponibilidad inexistente', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        User.findByPk.mockResolvedValue({ id: 1, name: 'Test User' });
        Disponibilidad.findByPk.mockResolvedValue(null);

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Disponibilidad no encontrada'
        });
      });

          test('debe rechazar disponibilidad ya ocupada', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        const mockPatient = { id: 1, name: 'Test User' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne.mockResolvedValue({ id: 1 }); // Disponibilidad ocupada

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'La disponibilidad seleccionada no está disponible'
        });
      });

          test('debe rechazar tipo de servicio inexistente', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        const mockPatient = { id: 1, name: 'Test User' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne.mockResolvedValue(null); // Disponibilidad libre
        ServiceType.findByPk.mockResolvedValue(null); // Tipo de servicio inexistente

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Tipo de servicio no encontrado'
        });
      });

          test('debe rechazar doble booking del mismo paciente', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        const mockPatient = { id: 1, name: 'Test User' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };
        const mockServiceType = {
          id: 1,
          name: 'Limpieza',
          duration: 60,
          especialidad_id: 1
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne
          .mockResolvedValueOnce(null) // Primera llamada: disponibilidad libre
          .mockResolvedValueOnce({ id: 1 }); // Segunda llamada: conflicto de horario
        ServiceType.findByPk.mockResolvedValue(mockServiceType);

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Ya tienes una cita pendiente o confirmada para ese horario'
        });
      });

          test('debe rechazar cuando paciente tiene 5 citas activas', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        const mockPatient = { id: 1, name: 'Test User' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };
        const mockServiceType = {
          id: 1,
          name: 'Limpieza',
          duration: 60,
          especialidad_id: 1
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne.mockResolvedValue(null); // Disponibilidad libre
        ServiceType.findByPk.mockResolvedValue(mockServiceType);
        Appointment.count.mockResolvedValue(5); // 5 citas activas

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Has alcanzado el límite de 5 citas activas (pendientes o confirmadas). Por favor, completa o cancela alguna antes de agendar otra'
        });
      });
  });

  describe('Creación exitosa', () => {
          test('debe crear cita exitosamente con datos válidos', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const mockAppointment = {
          id: 1,
          user_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: tomorrowStr,
          preferred_time: '09:00',
          status: 'pending',
          notes: 'Notas de prueba',
          createdAt: new Date('2024-01-10T10:30:00Z'),
          updatedAt: new Date('2024-01-10T10:30:00Z')
        };

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        const mockPatient = { id: 1, name: 'Test User', email: 'test@example.com' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };
        const mockServiceType = {
          id: 1,
          name: 'Limpieza',
          duration: 60,
          especialidad_id: 1
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne.mockResolvedValue(null); // Disponibilidad libre
        ServiceType.findByPk.mockResolvedValue(mockServiceType);
        Appointment.count.mockResolvedValue(0); // Sin citas activas
        Appointment.create.mockResolvedValue(mockAppointment);
        sendAppointmentConfirmationEmail.mockResolvedValue(true);

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(Appointment.create).toHaveBeenCalledWith({
          user_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: tomorrowStr,
          preferred_time: '09:00',
          status: 'pending',
          appointment_type: 'registered',
          notes: 'Notas de prueba'
        }, { transaction: mockTransaction });

        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(sendAppointmentConfirmationEmail).toHaveBeenCalled();

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            id: mockAppointment.id,
            patient_id: mockAppointment.user_id,
            disponibilidad_id: mockAppointment.disponibilidad_id,
            service_type_id: mockAppointment.service_type_id,
            preferred_date: mockAppointment.preferred_date,
            notes: mockAppointment.notes,
            status: mockAppointment.status,
            created_at: mockAppointment.createdAt,
            updated_at: mockAppointment.updatedAt
          },
          message: 'Cita creada exitosamente'
        });
      });

          test('debe crear cita sin notas', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const mockAppointment = {
          id: 1,
          user_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: tomorrowStr,
          preferred_time: '09:00',
          status: 'pending',
          notes: null,
          createdAt: new Date('2024-01-10T10:30:00Z'),
          updatedAt: new Date('2024-01-10T10:30:00Z')
        };

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr
          }
        });

        const mockPatient = { id: 1, name: 'Test User', email: 'test@example.com' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };
        const mockServiceType = {
          id: 1,
          name: 'Limpieza',
          duration: 60,
          especialidad_id: 1
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne.mockResolvedValue(null);
        ServiceType.findByPk.mockResolvedValue(mockServiceType);
        Appointment.count.mockResolvedValue(0);
        Appointment.create.mockResolvedValue(mockAppointment);
        sendAppointmentConfirmationEmail.mockResolvedValue(true);

        await appointmentController.createUserAppointment(mockReq, mockRes);

        expect(Appointment.create).toHaveBeenCalledWith({
          user_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: tomorrowStr,
          preferred_time: '09:00',
          status: 'pending',
          appointment_type: 'registered',
          notes: null
        }, { transaction: mockTransaction });

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            notes: null
          }),
          message: 'Cita creada exitosamente'
        });
      });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores internos del servidor', async () => {
      createUserAppointmentSchema.validate.mockReturnValue({
        error: null,
        value: {
          patient_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: '2024-12-25',
          notes: 'Notas de prueba'
        }
      });

      User.findByPk.mockRejectedValue(new Error('Error de base de datos'));

      await appointmentController.createUserAppointment(mockReq, mockRes);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error interno del servidor'
      });
    });

          test('debe manejar errores en el envío de email', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const mockAppointment = {
          id: 1,
          user_id: 1,
          disponibilidad_id: 1,
          service_type_id: 1,
          preferred_date: tomorrowStr,
          preferred_time: '09:00',
          status: 'pending',
          notes: 'Notas de prueba',
          createdAt: new Date('2024-01-10T10:30:00Z'),
          updatedAt: new Date('2024-01-10T10:30:00Z')
        };

        createUserAppointmentSchema.validate.mockReturnValue({
          error: null,
          value: {
            patient_id: 1,
            disponibilidad_id: 1,
            service_type_id: 1,
            preferred_date: tomorrowStr,
            notes: 'Notas de prueba'
          }
        });

        const mockPatient = { id: 1, name: 'Test User', email: 'test@example.com' };
        const mockDisponibilidad = {
          id: 1,
          date: tomorrowStr,
          start_time: '09:00:00',
          end_time: '10:00:00',
          especialidad_id: 1,
          especialidad: { name: 'Odontología', especialidad_id: 1 },
          dentist: { name: 'Dr. Test' }
        };
        const mockServiceType = {
          id: 1,
          name: 'Limpieza',
          duration: 60,
          especialidad_id: 1
        };

        User.findByPk.mockResolvedValue(mockPatient);
        Disponibilidad.findByPk.mockResolvedValue(mockDisponibilidad);
        Appointment.findOne.mockResolvedValue(null);
        ServiceType.findByPk.mockResolvedValue(mockServiceType);
        Appointment.count.mockResolvedValue(0);
        Appointment.create.mockResolvedValue(mockAppointment);
        sendAppointmentConfirmationEmail.mockRejectedValue(new Error('Error de email'));

        await appointmentController.createUserAppointment(mockReq, mockRes);

        // La cita se debe crear exitosamente aunque falle el email
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: expect.any(Object),
          message: 'Cita creada exitosamente'
        });
      });
  });
}); 