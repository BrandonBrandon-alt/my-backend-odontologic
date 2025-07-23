// Import the service to be tested
const authService = require("../../services/auth.service");

// Mock dependencies
const { User, RefreshToken } = require("../../models");
const { Op } = require("sequelize"); // Import Op for precise testing
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  sendActivationEmail,
  sendPasswordResetEmail,
} = require("../../utils/mailer");
const { sanitizeUser } = require("../../utils/user.utils");

// Mock the DTOs
const registerDto = require("../../dtos/auth/register.dto");
const loginDto = require("../../dtos/auth/login.dto");
const resetPasswordDto = require("../../dtos/auth/reset-password.dto");
const emailDto = require("../../dtos/auth/email.dto");
const verifyCodeDto = require("../../dtos/auth/verify-code.dto");
const tokenDto = require("../../dtos/auth/token.dto");

// Setup Jest mocks
jest.mock("../../models", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  RefreshToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../utils/mailer");
jest.mock("../../utils/user.utils");

// Mock all DTOs to simulate successful validation by default
jest.mock("../../dtos/auth/register.dto", () => ({ validate: jest.fn() }));
jest.mock("../../dtos/auth/login.dto", () => ({ validate: jest.fn() }));
jest.mock("../../dtos/auth/reset-password.dto", () => ({
  validate: jest.fn(),
}));
jest.mock("../../dtos/auth/email.dto", () => ({ validate: jest.fn() }));
jest.mock("../../dtos/auth/verify-code.dto", () => ({ validate: jest.fn() }));
jest.mock("../../dtos/auth/token.dto", () => ({ validate: jest.fn() }));

describe("Auth Service", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for successful DTO validation
    const mockValidate = (data) => ({ error: null, value: data });
    registerDto.validate.mockImplementation(mockValidate);
    loginDto.validate.mockImplementation(mockValidate);
    resetPasswordDto.validate.mockImplementation(mockValidate);
    emailDto.validate.mockImplementation(mockValidate);
    verifyCodeDto.validate.mockImplementation(mockValidate);
    tokenDto.validate.mockImplementation(mockValidate);
  });

  describe("register", () => {
    it("should register a user successfully", async () => {
      const inputData = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        idNumber: "12345",
        phone: "1234567",
      };
      const hashedPassword = "hashedPassword";
      const createdUser = { id: 1, ...inputData, password: hashedPassword };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(createdUser);
      sanitizeUser.mockReturnValue({ id: 1, name: "Test User" });

      const result = await authService.register(inputData);

      // Use the actual Op.or for a precise match
      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { id_number: inputData.idNumber },
            { email: inputData.email },
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(inputData.password, 10);
      expect(User.create).toHaveBeenCalled();
      expect(sendActivationEmail).toHaveBeenCalledWith(
        inputData.email,
        expect.any(String)
      );
      expect(result).toEqual({ id: 1, name: "Test User" });
    });

    it("should throw a conflict error if user already exists", async () => {
      const inputData = { email: "test@example.com" };
      User.findOne.mockResolvedValue({ id: 1 });

      await expect(authService.register(inputData)).rejects.toThrow(
        "User already exists with this email or ID number."
      );
    });
  });

  describe("login", () => {
    it("should log in a user successfully", async () => {
      const inputData = { email: "test@example.com", password: "password123" };
      const user = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        status: "active",
        role: "user",
      };

      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");
      sanitizeUser.mockReturnValue({ id: 1, name: "Test User" });

      const result = await authService.login(inputData);

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user).toEqual({ id: 1, name: "Test User" });
      expect(RefreshToken.create).toHaveBeenCalled();
    });

    it("should throw an error for invalid credentials", async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.login({})).rejects.toThrow(
        "Invalid credentials."
      );
    });

    it("should throw an error for an inactive account", async () => {
      const user = { id: 1, password: "hashedPassword", status: "inactive" };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      await expect(authService.login({})).rejects.toThrow(
        "Account is inactive or locked. Please activate your account."
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh the token successfully", async () => {
      const tokenData = { token: "valid-refresh-token" };
      const dbToken = {
        token: tokenData.token,
        expires_at: new Date(Date.now() + 10000),
      };
      const decodedUser = { id: 1, role: "user" };

      RefreshToken.findOne.mockResolvedValue(dbToken);
      jwt.verify.mockReturnValue(decodedUser);
      User.findByPk.mockResolvedValue({ id: 1, role: "user" });
      jwt.sign.mockReturnValue("new-access-token");

      const result = await authService.refreshToken(tokenData);

      expect(result.accessToken).toBe("new-access-token");
    });

    it("should throw an error for an expired refresh token", async () => {
      const dbToken = {
        token: "expired-token",
        expires_at: new Date(Date.now() - 10000),
        destroy: jest.fn(),
      };
      RefreshToken.findOne.mockResolvedValue(dbToken);
      await expect(
        authService.refreshToken({ token: "expired-token" })
      ).rejects.toThrow("Refresh token has expired.");
      expect(dbToken.destroy).toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should call destroy on the refresh token", async () => {
      await authService.logout({ token: "some-token" });
      expect(RefreshToken.destroy).toHaveBeenCalledWith({
        where: { token: "some-token" },
      });
    });
  });

  describe("activateAccount", () => {
    it("should activate the account successfully", async () => {
      const user = {
        status: "inactive",
        activation_expires_at: new Date(Date.now() + 10000),
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(user);

      await authService.activateAccount({
        email: "test@example.com",
        code: "VALIDCODE",
      });

      expect(user.status).toBe("active");
      expect(user.activation_code).toBeNull();
      expect(user.save).toHaveBeenCalled();
    });

    it("should throw an error for an expired activation code", async () => {
      const user = { activation_expires_at: new Date(Date.now() - 10000) };
      User.findOne.mockResolvedValue(user);
      await expect(authService.activateAccount({})).rejects.toThrow(
        "Activation code has expired. Please request a new one."
      );
    });
  });

  describe("resendActivationCode", () => {
    it("should resend the activation code successfully", async () => {
      const user = {
        email: "test@example.com",
        status: "inactive",
        save: jest.fn(),
      };
      User.findOne.mockResolvedValue(user);

      await authService.resendActivationCode({ email: user.email });

      expect(user.save).toHaveBeenCalled();
      expect(sendActivationEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String)
      );
    });

    it("should throw an error if the account is already active", async () => {
      const user = { status: "active" };
      User.findOne.mockResolvedValue(user);
      await expect(authService.resendActivationCode({})).rejects.toThrow(
        "This account is already active."
      );
    });
  });

  describe("requestPasswordReset", () => {
    it("should request a password reset successfully", async () => {
      const user = { email: "test@example.com", save: jest.fn() };
      User.findOne.mockResolvedValue(user);

      await authService.requestPasswordReset({ email: user.email });

      expect(user.save).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String)
      );
    });

    it("should throw an error if user is not found", async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.requestPasswordReset({})).rejects.toThrow(
        "User not found."
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset the password successfully", async () => {
      const user = {
        password_reset_expires_at: new Date(Date.now() + 10000),
        save: jest.fn(),
      };
      User.findOne.mockResolvedValue(user);
      bcrypt.hash.mockResolvedValue("newHashedPassword");

      await authService.resetPassword({
        resetCode: "VALIDCODE",
        newPassword: "newPassword123!",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123!", 10);
      expect(user.password).toBe("newHashedPassword");
      expect(user.password_reset_code).toBeNull();
      expect(user.save).toHaveBeenCalled();
    });

    it("should throw an error for an invalid reset code", async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.resetPassword({})).rejects.toThrow(
        "Invalid or expired reset code."
      );
    });
  });

  describe("verifyResetCode", () => {
    it("should verify the code successfully if it is valid", async () => {
      const user = { password_reset_expires_at: new Date(Date.now() + 10000) };
      User.findOne.mockResolvedValue(user);
      // This function doesn't return anything on success, so we just check it doesn't throw
      await expect(authService.verifyResetCode({})).resolves.toBeUndefined();
    });

    it("should throw an error for an invalid code", async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.verifyResetCode({})).rejects.toThrow(
        "Invalid email or reset code."
      );
    });
  });
});
