const availabilityService = require("../../services/availability.service");
const {
  Availability,
  User,
  Specialty,
  Appointment,
  Op,
} = require("../../models");
const createAvailabilityDto = require("../../dtos/availability/create-availability.dto");
const updateAvailabilityDto = require("../../dtos/availability/update-availability.dto");
const AvailabilityOutputDto = require("../../dtos/availability/availability-output.dto");

// Mock dependencies
jest.mock("../../models", () => ({
  Availability: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  User: { findOne: jest.fn() },
  Specialty: { findOne: jest.fn() },
  Appointment: { count: jest.fn() },
  Op: {
    // Mocking Sequelize operators
    gt: Symbol("gt"),
    lt: Symbol("lt"),
    or: Symbol("or"),
    ne: Symbol("ne"),
  },
}));

jest.mock("../../dtos/availability/create-availability.dto", () => ({
  validate: jest.fn(),
}));
jest.mock("../../dtos/availability/update-availability.dto", () => ({
  validate: jest.fn(),
}));
// We don't mock the output DTO itself, but its constructor to check its usage
jest.mock("../../dtos/availability/availability-output.dto");

describe("Availability Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful DTO validation
    const mockValidate = (data) => ({ error: null, value: data });
    createAvailabilityDto.validate.mockImplementation(mockValidate);
    updateAvailabilityDto.validate.mockImplementation(mockValidate);
  });

  describe("create", () => {
    it("should create an availability slot successfully", async () => {
      const inputData = {
        dentist_id: 1,
        specialty_id: 1,
        date: "2025-10-10",
        start_time: "09:00:00",
        end_time: "10:00:00",
      };

      User.findOne.mockResolvedValue({
        id: 1,
        role: "dentist",
        status: "active",
      });
      Specialty.findOne.mockResolvedValue({ id: 1, is_active: true });
      Availability.findOne.mockResolvedValue(null); // No conflict
      Availability.create.mockResolvedValue({ id: 100, ...inputData });
      // Mock the final fetch for the output DTO
      Availability.findByPk.mockResolvedValue({
        id: 100,
        ...inputData,
        dentist: {},
        specialty: {},
      });
      AvailabilityOutputDto.mockImplementation((data) => data);

      await availabilityService.create(inputData);

      expect(User.findOne).toHaveBeenCalled();
      expect(Specialty.findOne).toHaveBeenCalled();
      expect(Availability.findOne).toHaveBeenCalled(); // Conflict check
      expect(Availability.create).toHaveBeenCalledWith(inputData);
    });

    it("should throw an error if dentist is not found", async () => {
      User.findOne.mockResolvedValue(null);
      await expect(availabilityService.create({})).rejects.toThrow(
        "Dentist not found or is not active"
      );
    });

    it("should throw an error for a scheduling conflict", async () => {
      User.findOne.mockResolvedValue({ id: 1 });
      Specialty.findOne.mockResolvedValue({ id: 1 });
      Availability.findOne.mockResolvedValue({ id: 99 }); // Conflict found

      await expect(availabilityService.create({})).rejects.toThrow(
        "This availability conflicts with an existing one"
      );
    });
  });

  describe("update", () => {
    it("should update an availability slot successfully", async () => {
      const updateData = { date: "2025-11-11" };
      const mockAvailability = { id: 1, update: jest.fn() };

      Availability.findByPk.mockResolvedValue(mockAvailability);
      Availability.findOne.mockResolvedValue(null); // No conflict
      AvailabilityOutputDto.mockImplementation((data) => data);

      await availabilityService.update(1, updateData);

      expect(Availability.findByPk).toHaveBeenCalledWith(1);
      expect(Availability.findOne).toHaveBeenCalled(); // Conflict check
      expect(mockAvailability.update).toHaveBeenCalledWith(updateData);
    });

    it("should throw an error if availability to update is not found", async () => {
      Availability.findByPk.mockResolvedValue(null);
      await expect(availabilityService.update(999, {})).rejects.toThrow(
        "Availability not found"
      );
    });
  });

  describe("deactivate", () => {
    it("should deactivate an availability slot successfully", async () => {
      const mockAvailability = { id: 1, update: jest.fn() };
      Availability.findByPk.mockResolvedValue(mockAvailability);
      Appointment.count.mockResolvedValue(0);

      const result = await availabilityService.deactivate(1);

      expect(mockAvailability.update).toHaveBeenCalledWith({
        is_active: false,
      });
      expect(result.message).toBe("Availability deactivated successfully.");
    });

    it("should throw an error if there are pending appointments", async () => {
      const mockAvailability = { id: 1 };
      Availability.findByPk.mockResolvedValue(mockAvailability);
      Appointment.count.mockResolvedValue(1); // One pending appointment

      await expect(availabilityService.deactivate(1)).rejects.toThrow(
        "Cannot deactivate availability with pending or confirmed appointments"
      );
    });
  });
});
