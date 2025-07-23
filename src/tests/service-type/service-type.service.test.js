const serviceTypeService = require("../../services/service-type.service");
const { ServiceType, Specialty } = require("../../models");

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

// CORRECCIÓN: Mock los DTOs como schemas de Joi
jest.mock("../../dtos/service-type/create-service-type.dto", () => ({
  validate: jest.fn(),
}));

jest.mock("../../dtos/service-type/update-service-type.dto", () => ({
  validate: jest.fn(),
}));

// Mock the output DTO
jest.mock("../../dtos/service-type/service-type-output.dto", () => {
  const mockConstructor = jest.fn().mockImplementation((data) => data);
  mockConstructor.fromList = jest.fn();
  return mockConstructor;
});

// Mock http-errors
jest.mock("http-errors", () =>
  jest.fn((status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
  })
);

// Importar DESPUÉS de los mocks
const createServiceTypeDto = require("../../dtos/service-type/create-service-type.dto");
const updateServiceTypeDto = require("../../dtos/service-type/update-service-type.dto");
const ServiceTypeOutputDto = require("../../dtos/service-type/service-type-output.dto");

describe("ServiceType Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup por defecto para validaciones exitosas
    createServiceTypeDto.validate.mockReturnValue({
      error: null,
      value: {},
    });

    updateServiceTypeDto.validate.mockReturnValue({
      error: null,
      value: {},
    });

    // Setup por defecto para ServiceTypeOutputDto
    ServiceTypeOutputDto.fromList.mockReturnValue([]);
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

      expect(ServiceType.findAll).toHaveBeenCalled();
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
      description: "A new service description",
    };

    it("should create a new service type successfully", async () => {
      // Mock validación exitosa
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
      const invalidData = { name: "A" }; // Too short

      // Mock validación con error (como lo haría Joi realmente)
      createServiceTypeDto.validate.mockReturnValue({
        error: {
          details: [
            {
              message: "Service type name must be at least 2 characters long.",
            },
          ],
        },
        value: undefined,
      });

      await expect(serviceTypeService.create(invalidData)).rejects.toThrow(
        "Service type name must be at least 2 characters long."
      );

      expect(createServiceTypeDto.validate).toHaveBeenCalledWith(invalidData);
      expect(Specialty.findOne).not.toHaveBeenCalled();
    });

    it("should throw validation error for missing required fields", async () => {
      const invalidData = {}; // Missing required fields

      createServiceTypeDto.validate.mockReturnValue({
        error: {
          details: [{ message: "Service type name is required." }],
        },
        value: undefined,
      });

      await expect(serviceTypeService.create(invalidData)).rejects.toThrow(
        "Service type name is required."
      );

      expect(createServiceTypeDto.validate).toHaveBeenCalledWith(invalidData);
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
    const updateData = {
      name: "Updated Name",
      duration: 45,
    };
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
        duration: 30,
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
      const invalidData = { name: "" }; // Empty name

      updateServiceTypeDto.validate.mockReturnValue({
        error: {
          details: [
            {
              message: "Service type name must be at least 2 characters long.",
            },
          ],
        },
        value: undefined,
      });

      await expect(
        serviceTypeService.update(serviceTypeId, invalidData)
      ).rejects.toThrow(
        "Service type name must be at least 2 characters long."
      );

      expect(ServiceType.findByPk).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid duration", async () => {
      const invalidData = { duration: 10 }; // Less than 15 minutes

      updateServiceTypeDto.validate.mockReturnValue({
        error: {
          details: [{ message: "Duration must be at least 15 minutes." }],
        },
        value: undefined,
      });

      await expect(
        serviceTypeService.update(serviceTypeId, invalidData)
      ).rejects.toThrow("Duration must be at least 15 minutes.");
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
});
