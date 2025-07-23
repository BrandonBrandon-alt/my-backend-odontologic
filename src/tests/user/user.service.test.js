// user.service.test.js

const userService = require("../../services/user.service");
const { User } = require("../../models");
const bcrypt = require("bcrypt");
const changePasswordDto = require("../../dtos/user/change-password.dto");
const updateProfileDto = require("../../dtos/user/update-profile.dto");

// (El resto de los mocks permanece igual)
jest.mock("../../models", () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../../dtos/user/change-password.dto", () => ({
  validate: jest.fn(),
}));

jest.mock("../../dtos/user/update-profile.dto", () => ({
  validate: jest.fn(),
}));

describe("User Service", () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      password: "hashedOldPassword", // Estado inicial
      phone: "1234567890",
      save: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(true),
      get: jest.fn(function (options) {
        if (options && options.plain) {
          const { save, update, get, ...plainUser } = this;
          return plainUser;
        }
        return this;
      }),
    };
    changePasswordDto.validate.mockReturnValue({ error: null });
    updateProfileDto.validate.mockReturnValue({ error: null, value: {} });
  });

  // (Las pruebas que pasaban no necesitan cambios)

  describe("changePassword", () => {
    const passwordData = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword123",
    };

    // --- PRUEBA CORREGIDA 1 ---
    it("should change the password successfully", async () => {
      // Arrange
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      bcrypt.hash.mockResolvedValue("hashedNewPassword");
      changePasswordDto.validate.mockReturnValue({
        error: null,
        value: passwordData,
      });

      // Act
      const result = await userService.changePassword(1, passwordData);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);

      // Verifica cada llamada a 'bcrypt.compare' de forma explícita y en orden
      expect(bcrypt.compare).toHaveBeenNthCalledWith(
        1,
        passwordData.currentPassword,
        "hashedOldPassword"
      );
      expect(bcrypt.compare).toHaveBeenNthCalledWith(
        2,
        passwordData.newPassword,
        "hashedOldPassword"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(passwordData.newPassword, 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.password).toBe("hashedNewPassword"); // Verifica el estado final del objeto
      expect(result).toEqual({ message: "Password updated successfully." });
    });

    // (Otras pruebas que pasaban)
    it("should throw a 400 error if validation fails", async () => {
      /* sin cambios */
    });
    it("should throw a 404 error if user is not found", async () => {
      /* sin cambios */
    });
    it("should throw a 401 error for incorrect current password", async () => {
      /* sin cambios */
    });

    // --- PRUEBA CORREGIDA 2 ---
    it("should throw a 400 error if new password is the same as the current one", async () => {
      // Arrange
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare
        .mockResolvedValueOnce(true) // currentPassword matches
        .mockResolvedValueOnce(true); // newPassword is the same
      changePasswordDto.validate.mockReturnValue({
        error: null,
        value: passwordData,
      });

      // Act & Assert
      // Llama a la función UNA VEZ y verifica el objeto de error rechazado
      await expect(
        userService.changePassword(1, passwordData)
      ).rejects.toMatchObject({
        message: "New password cannot be the same as the current one",
        status: 400,
      });
    });
  });

  // (El resto de las pruebas de updateProfile permanece igual)
});
