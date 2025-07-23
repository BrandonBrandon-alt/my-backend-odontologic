const appointmentService = require("../../services/appointment.service");
const {
  Appointment,
  GuestPatient,
  User,
  Availability,
  ServiceType,
  sequelize,
} = require("../../models");
const createGuestAppointmentDto = require("../../dtos//appointment/create-guest-appointment.dto");
const createUserAppointmentDto = require("../../dtos/appointment/create-user-appointment.dto");
const updateAppointmentStatusDto = require("../../dtos/appointment/update-appointment-status.dto");
const AppointmentOutputDto = require("../../dtos/appointment/appointment-output.dto");

// Mock all necessary modules
jest.mock("../../models", () => ({
  Appointment: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
  },
  GuestPatient: { findOrCreate: jest.fn(), findByPk: jest.fn() },
  User: { findByPk: jest.fn() },
  Availability: { findOne: jest.fn() },
  ServiceType: { findOne: jest.fn() },
  sequelize: { transaction: jest.fn() }, // Mock sequelize transaction
}));

jest.mock("../../dtos//appointment/create-guest-appointment.dto", () => ({
  validate: jest.fn(),
}));
jest.mock("../../dtos/appointment/create-user-appointment.dto", () => ({
  validate: jest.fn(),
}));
jest.mock("../../dtos/appointment/update-appointment-status.dto", () => ({
  validate: jest.fn(),
}));
// We don't mock the output DTO, we test its output
jest.mock("../../dtos/appointment/appointment-output.dto");

describe("Appointment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful DTO validation
    const mockValidate = (data) => ({ error: null, value: data });
    createGuestAppointmentDto.validate.mockImplementation(mockValidate);
    createUserAppointmentDto.validate.mockImplementation(mockValidate);
    updateAppointmentStatusDto.validate.mockImplementation(mockValidate);
  });

  describe("create", () => {
    // Mock the transaction logic
    sequelize.transaction.mockImplementation(async (callback) => {
      const t = {}; // Mock transaction object
      return await callback(t);
    });

    it("should create an appointment for a guest successfully", async () => {
      const inputData = {
        name: "Guest User",
        email: "guest@example.com",
        phone: "123456789",
        availability_id: 1,
        service_type_id: 1,
        notes: "Test note",
      };
      const mockGuest = { id: 1, ...inputData };
      const mockAvailability = { id: 1, is_active: true };
      const mockServiceType = { id: 1, is_active: true };
      const mockAppointment = { id: 101, ...inputData, guest_patient_id: 1 };

      GuestPatient.findOrCreate.mockResolvedValue([mockGuest, true]);
      Availability.findOne.mockResolvedValue(mockAvailability);
      ServiceType.findOne.mockResolvedValue(mockServiceType);
      Appointment.create.mockResolvedValue(mockAppointment);
      Appointment.findByPk.mockResolvedValue(mockAppointment); // For the final fetch
      AppointmentOutputDto.mockImplementation((data) => data); // Simple mock for output

      await appointmentService.create(inputData, null);

      expect(GuestPatient.findOrCreate).toHaveBeenCalledWith({
        where: { email: inputData.email },
        defaults: {
          name: inputData.name,
          phone: inputData.phone,
          email: inputData.email,
        },
        transaction: expect.any(Object),
      });
      expect(Appointment.create).toHaveBeenCalled();
    });

    it("should create an appointment for a registered user successfully", async () => {
      const inputData = {
        availability_id: 1,
        service_type_id: 1,
        notes: "Test note",
      };
      const user = { id: 5 };
      const mockAvailability = { id: 1, is_active: true };
      const mockServiceType = { id: 1, is_active: true };
      const mockAppointment = { id: 102, ...inputData, user_id: user.id };

      Availability.findOne.mockResolvedValue(mockAvailability);
      ServiceType.findOne.mockResolvedValue(mockServiceType);
      Appointment.create.mockResolvedValue(mockAppointment);
      Appointment.findByPk.mockResolvedValue(mockAppointment);
      AppointmentOutputDto.mockImplementation((data) => data);

      await appointmentService.create(inputData, user);

      expect(GuestPatient.findOrCreate).not.toHaveBeenCalled();
      expect(Appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: user.id }),
        expect.any(Object)
      );
    });

    it("should throw an error if availability is not found", async () => {
      Availability.findOne.mockResolvedValue(null);
      await expect(appointmentService.create({}, { id: 1 })).rejects.toThrow(
        "The selected availability slot was not found or is not active."
      );
    });
  });

  describe("getMyAppointments", () => {
    it("should return paginated appointments for a user", async () => {
      const user = { id: 1 };
      const query = { page: 1, limit: 5 };
      const mockAppointments = { count: 1, rows: [{ id: 1 }] };

      Appointment.findAndCountAll.mockResolvedValue(mockAppointments);
      AppointmentOutputDto.fromList.mockReturnValue([{ id: 1 }]);

      const result = await appointmentService.getMyAppointments(user, query);

      expect(Appointment.findAndCountAll).toHaveBeenCalled();
      expect(result.appointments).toEqual([{ id: 1 }]);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe("updateStatus", () => {
    it("should update an appointment status successfully", async () => {
      const mockAppointment = { id: 1, status: "pending", update: jest.fn() };

      Appointment.findByPk.mockResolvedValue(mockAppointment);
      AppointmentOutputDto.mockImplementation((data) => data);

      await appointmentService.updateStatus(1, { status: "confirmed" });

      expect(mockAppointment.update).toHaveBeenCalledWith({
        status: "confirmed",
      });
    });

    it("should throw an error if appointment is not found", async () => {
      Appointment.findByPk.mockResolvedValue(null);
      await expect(
        appointmentService.updateStatus(999, { status: "confirmed" })
      ).rejects.toThrow("Appointment not found");
    });
  });
});
