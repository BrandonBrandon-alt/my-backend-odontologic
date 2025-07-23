const contactService = require("../../services/contact.service");
const { ContactMessage } = require("../../models");
const {
  sendConfirmationEmail,
  sendNotificationEmail,
} = require("../../utils/mailer");
const createContactMessageDto = require("../../dtos/contact/create-contact-message.dto");

// Mock dependencies
jest.mock("../../models", () => ({
  ContactMessage: { create: jest.fn() },
}));
jest.mock("../../utils/mailer");
jest.mock("../../dtos/contact/create-contact-message.dto", () => ({
  validate: jest.fn(),
}));

describe("Contact Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful DTO validation
    const mockValidate = (data) => ({ error: null, value: data });
    createContactMessageDto.validate.mockImplementation(mockValidate);
  });

  describe("sendContactMessage", () => {
    it("should send a message successfully and return the created message details", async () => {
      const inputData = {
        name: "John Doe",
        email: "john.doe@example.com",
        subject: "consulta",
        message: "This is a test message.",
      };
      const meta = { ip: "127.0.0.1", userAgent: "Jest Test" };
      const mockCreatedMessage = {
        id: "some-uuid",
        createdAt: new Date(),
        status: "pending",
        ...inputData,
      };

      ContactMessage.create.mockResolvedValue(mockCreatedMessage);
      // Mock mailer functions to resolve immediately
      sendConfirmationEmail.mockResolvedValue();
      sendNotificationEmail.mockResolvedValue();

      const result = await contactService.sendContactMessage(inputData, meta);

      // 1. Check if validation was called
      expect(createContactMessageDto.validate).toHaveBeenCalledWith(inputData);

      // 2. Check if the message was created with the correct data
      expect(ContactMessage.create).toHaveBeenCalledWith({
        ...inputData,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      });

      // 3. Check if emails were triggered
      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        inputData.email,
        inputData.name
      );
      expect(sendNotificationEmail).toHaveBeenCalledWith(mockCreatedMessage);

      // 4. Check the final returned value
      expect(result).toEqual({
        id: mockCreatedMessage.id,
        timestamp: mockCreatedMessage.createdAt,
        status: mockCreatedMessage.status,
      });
    });

    it("should throw a validation error if the DTO validation fails", async () => {
      const validationError = new Error("Invalid name");
      createContactMessageDto.validate.mockReturnValue({
        error: { details: [validationError] },
        value: {},
      });

      await expect(contactService.sendContactMessage({}, {})).rejects.toThrow(
        "Invalid name"
      );

      // Ensure no database or email actions were taken
      expect(ContactMessage.create).not.toHaveBeenCalled();
      expect(sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it("should handle internal errors during database creation", async () => {
      const dbError = new Error("Database connection failed");
      ContactMessage.create.mockRejectedValue(dbError);

      await expect(contactService.sendContactMessage({}, {})).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
