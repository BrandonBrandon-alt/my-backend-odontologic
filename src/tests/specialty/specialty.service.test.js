const serviceTypeService = require("../../services/service-type.service");
const { ServiceType, Specialty } = require("../../models");
const createServiceTypeDto = require("../../dtos/service-type/create-service-type.dto");
const updateServiceTypeDto = require("../../dtos/service-type/update-service-type.dto");
const ServiceTypeOutputDto = require("../../dtos/service-type/service-type-output.dto");

// Mock dependencies
jest.mock("../../models", () => ({
  ServiceType: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Specialty: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// CORRECCIÓN: Mock los DTOs correctamente
jest.mock("../../dtos/service-type/create-service-type.dto", () => ({
  validate: jest.fn(),
}));

jest.mock("../../dtos/service-type/update-service-type.dto", () => ({
  validate: jest.fn(),
}));

// Mock the output DTO
jest.mock("../../dtos/service-type/service-type-output.dto", () => {
  return jest.fn().mockImplementation((data) => data);
});

// Mock http-errors para manejo de errores
jest.mock("http-errors", () =>
  jest.fn((status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
  })
);

describe("ServiceType Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // CORRECCIÓN: Setup por defecto para validaciones exitosas
    createServiceTypeDto.validate.mockReturnValue({
      error: null,
      value: null,
    });

    updateServiceTypeDto.validate.mockReturnValue({
      error: null,
      value: null,
    });

    // Setup por defecto para ServiceTypeOutputDto
    ServiceTypeOutputDto.fromList = jest.fn().mockReturnValue([]);
  });

  describe("getAll", () => {
    it("should return a list of service types", async () => {
      const mockServiceTypes = [
        { id: 1, name: "Cleaning", specialty_id: 1 },
        { id: 2, name: "Consultation", specialty_id: 2 },
      ];

      ServiceType.findAll.mockResolvedValue(mockServiceTypes);
      ServiceTypeOutputDto.fromList.mockReturnValue(mockServiceTypes);

      const result = await serviceTypeService.getAll();

      expect(ServiceType.findAll).toHaveBeenCalledWith({
        include: expect.any(Array), // Assuming it includes Specialty
      });
      expect(ServiceTypeOutputDto.fromList).toHaveBeenCalledWith(
        mockServiceTypes
      );
      expect(result).toEqual(mockServiceTypes);
    });

    it("should handle empty results", async () => {
      ServiceType.findAll.mockResolvedValue([]);
      ServiceTypeOutputDto.fromList.mockReturnValue([]);

      const result = await serviceTypeService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getBySpecialty", () => {
    it("should return a list of service types for a given specialty", async () => {
      const specialtyId = 1;
      const mockServiceTypes = [
        { id: 1, name: "Cleaning", specialty_id: specialtyId },
      ];

      ServiceType.findAll.mockResolvedValue(mockServiceTypes);
      ServiceTypeOutputDto.fromList.mockReturnValue(mockServiceTypes);

      const result = await serviceTypeService.getBySpecialty(specialtyId);

      expect(ServiceType.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { specialty_id: specialtyId, is_active: true },
        })
      );
      expect(ServiceTypeOutputDto.fromList).toHaveBeenCalledWith(
        mockServiceTypes
      );
      expect(result).toEqual(mockServiceTypes);
    });

    it("should return empty array if no service types found for specialty", async () => {
      ServiceType.findAll.mockResolvedValue([]);
      ServiceTypeOutputDto.fromList.mockReturnValue([]);

      const result = await serviceTypeService.getBySpecialty(999);

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    const validInputData = {
      name: "New Service",
      specialty_id: 1,
      duration: 30,
    };

    it("should create a new service type successfully", async () => {
      // CORRECCIÓN: Mock la validación correctamente
      createServiceTypeDto.validate.mockReturnValue({
        error: null,
        value: validInputData,
      });

      const mockSpecialty = { id: 1, name: "Cardiology", is_active: true };
      const createdServiceType = {
        ...validInputData,
        id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      Specialty.findOne.mockResolvedValue(mockSpecialty);
      ServiceType.findOne.mockResolvedValue(null); // No conflict
      ServiceType.create.mockResolvedValue(createdServiceType);
      ServiceTypeOutputDto.mockImplementation((data) => data);

      const result = await serviceTypeService.create(validInputData);

      expect(createServiceTypeDto.validate).toHaveBeenCalledWith(
        validInputData
      );
      expect(Specialty.findOne).toHaveBeenCalledWith({
        where: { id: validInputData.specialty_id, is_active: true },
      });
      expect(ServiceType.findOne).toHaveBeenCalledWith({
        where: {
          name: validInputData.name,
          specialty_id: validInputData.specialty_id,
        },
      });
      expect(ServiceType.create).toHaveBeenCalledWith(validInputData);

      // Verify specialty was attached
      expect(createdServiceType.specialty).toEqual(mockSpecialty);
      expect(ServiceTypeOutputDto).toHaveBeenCalledWith(createdServiceType);
      expect(result).toBeDefined();
    });

    it("should throw validation error for invalid input", async () => {
      const invalidData = { name: "" }; // Invalid data

      createServiceTypeDto.validate.mockReturnValue({
        error: {
          details: [{ message: "Name is required" }],
        },
        value: null,
      });

      await expect(serviceTypeService.create(invalidData)).rejects.toThrow(
        "Name is required"
      );

      expect(createServiceTypeDto.validate).toHaveBeenCalledWith(invalidData);
      expect(Specialty.findOne).not.toHaveBeenCalled();
    });

    it("should throw an error if specialty is not found", async () => {
      createServiceTypeDto.validate.mockReturnValue({
        error: null,
        value: validInputData,
      });

      Specialty.findOne.mockResolvedValue(null);

      await expect(serviceTypeService.create(validInputData)).rejects.toThrow(
        "Specialty not found"
      );

      expect(createServiceTypeDto.validate).toHaveBeenCalledWith(
        validInputData
      );
      expect(Specialty.findOne).toHaveBeenCalledWith({
        where: { id: validInputData.specialty_id, is_active: true },
      });
      expect(ServiceType.findOne).not.toHaveBeenCalled();
      expect(ServiceType.create).not.toHaveBeenCalled();
    });

    it("should throw an error if service type with same name already exists", async () => {
      createServiceTypeDto.validate.mockReturnValue({
        error: null,
        value: validInputData,
      });

      const mockSpecialty = { id: 1, name: "Cardiology", is_active: true };
      const existingServiceType = {
        id: 2,
        name: validInputData.name,
        specialty_id: validInputData.specialty_id,
      };

      Specialty.findOne.mockResolvedValue(mockSpecialty);
      ServiceType.findOne.mockResolvedValue(existingServiceType); // Conflict

      await expect(serviceTypeService.create(validInputData)).rejects.toThrow(
        "A service type with this name already exists in this specialty"
      );

      expect(ServiceType.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateData = { name: "Updated Name" };
    const serviceTypeId = 1;

    it("should update a service type successfully", async () => {
      updateServiceTypeDto.validate.mockReturnValue({
        error: null,
        value: updateData,
      });

      const mockServiceType = {
        id: serviceTypeId,
        name: "Old Name",
        specialty_id: 1,
        update: jest.fn().mockResolvedValue(),
      };

      const updatedServiceType = {
        ...mockServiceType,
        ...updateData,
      };

      ServiceType.findByPk.mockResolvedValue(mockServiceType);
      ServiceType.findOne
        .mockResolvedValueOnce(null) // No conflict check
        .mockResolvedValueOnce(updatedServiceType); // Refetch after update

      ServiceTypeOutputDto.mockImplementation((data) => data);

      const result = await serviceTypeService.update(serviceTypeId, updateData);

      expect(updateServiceTypeDto.validate).toHaveBeenCalledWith(updateData);
      expect(ServiceType.findByPk).toHaveBeenCalledWith(serviceTypeId);
      expect(mockServiceType.update).toHaveBeenCalledWith(updateData);
      expect(ServiceTypeOutputDto).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should throw an error if service type to update is not found", async () => {
      updateServiceTypeDto.validate.mockReturnValue({
        error: null,
        value: updateData,
      });

      ServiceType.findByPk.mockResolvedValue(null);

      await expect(serviceTypeService.update(999, updateData)).rejects.toThrow(
        "Service type not found"
      );

      expect(ServiceType.findByPk).toHaveBeenCalledWith(999);
    });

    it("should throw validation error for invalid update data", async () => {
      const invalidData = { name: "" };

      updateServiceTypeDto.validate.mockReturnValue({
        error: {
          details: [{ message: "Name cannot be empty" }],
        },
        value: null,
      });

      await expect(
        serviceTypeService.update(serviceTypeId, invalidData)
      ).rejects.toThrow("Name cannot be empty");

      expect(ServiceType.findByPk).not.toHaveBeenCalled();
    });
  });

  describe("deactivate", () => {
    it("should deactivate a service type successfully", async () => {
      const serviceTypeId = 1;
      const mockServiceType = {
        id: serviceTypeId,
        name: "Test Service",
        is_active: true,
        update: jest.fn().mockResolvedValue(),
      };

      ServiceType.findByPk.mockResolvedValue(mockServiceType);

      const result = await serviceTypeService.deactivate(serviceTypeId);

      expect(ServiceType.findByPk).toHaveBeenCalledWith(serviceTypeId);
      expect(mockServiceType.update).toHaveBeenCalledWith({ is_active: false });
      expect(result.message).toBe("Service type deactivated successfully.");
    });

    it("should throw an error if service type to deactivate is not found", async () => {
      ServiceType.findByPk.mockResolvedValue(null);

      await expect(serviceTypeService.deactivate(999)).rejects.toThrow(
        "Service type not found"
      );

      expect(ServiceType.findByPk).toHaveBeenCalledWith(999);
    });

    it("should handle already deactivated service type", async () => {
      const serviceTypeId = 1;
      const mockServiceType = {
        id: serviceTypeId,
        name: "Test Service",
        is_active: false, // Already deactivated
        update: jest.fn().mockResolvedValue(),
      };

      ServiceType.findByPk.mockResolvedValue(mockServiceType);

      const result = await serviceTypeService.deactivate(serviceTypeId);

      expect(mockServiceType.update).toHaveBeenCalledWith({ is_active: false });
      expect(result.message).toBe("Service type deactivated successfully.");
    });
  });

  describe("getById", () => {
    it("should return a service type by id", async () => {
      const serviceTypeId = 1;
      const mockServiceType = {
        id: serviceTypeId,
        name: "Test Service",
        specialty_id: 1,
      };

      ServiceType.findOne.mockResolvedValue(mockServiceType);
      ServiceTypeOutputDto.mockImplementation((data) => data);

      const result = await serviceTypeService.getById(serviceTypeId);

      expect(ServiceType.findOne).toHaveBeenCalledWith({
        where: { id: serviceTypeId, is_active: true },
        include: expect.any(Array),
      });
      expect(ServiceTypeOutputDto).toHaveBeenCalledWith(mockServiceType);
      expect(result).toEqual(mockServiceType);
    });

    it("should throw an error if service type is not found", async () => {
      ServiceType.findOne.mockResolvedValue(null);

      await expect(serviceTypeService.getById(999)).rejects.toThrow(
        "Service type not found"
      );
    });
  });
});
