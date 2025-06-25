const userController = require('../../controllers/user-controller');
const bcrypt = require('bcrypt');

// Mock de los modelos
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
    update: jest.fn()
  }
}));

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

const { User } = require('../../models');

describe('User Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 }
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('debería obtener el perfil del usuario exitosamente', async () => {
      const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '1234567890',
        role: 'user',
        status: 'active',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '1234567890',
          role: 'user',
          status: 'active'
        })
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.getProfile(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        user: mockUser
      });
    });

    it('debería devolver 404 si el usuario no existe', async () => {
      User.findByPk.mockResolvedValue(null);

      await userController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });

    it('debería manejar errores internos', async () => {
      User.findByPk.mockRejectedValue(new Error('Error de base de datos'));

      await userController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error al obtener perfil',
        details: 'Error de base de datos'
      });
    });
  });

  describe('changePassword', () => {
    it('debería cambiar la contraseña exitosamente', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const mockUser = {
        id: 1,
        password: 'hashedOldPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.body = passwordData;
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare
        .mockResolvedValueOnce(true) // currentPassword es correcta
        .mockResolvedValueOnce(false); // newPassword es diferente
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      await userController.changePassword(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'hashedOldPassword');
      expect(bcrypt.compare).toHaveBeenCalledWith('newPassword123', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Contraseña actualizada correctamente.'
      });
    });

    it('debería rechazar si el usuario no existe', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      mockReq.body = passwordData;
      User.findByPk.mockResolvedValue(null);

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });

    it('debería rechazar si la contraseña actual es incorrecta', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      const mockUser = {
        id: 1,
        password: 'hashedOldPassword'
      };

      mockReq.body = passwordData;
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'La contraseña actual es incorrecta.'
      });
    });

    it('debería rechazar si la nueva contraseña es igual a la actual', async () => {
      const passwordData = {
        currentPassword: 'samePassword',
        newPassword: 'samePassword'
      };

      const mockUser = {
        id: 1,
        password: 'hashedSamePassword'
      };

      mockReq.body = passwordData;
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare
        .mockResolvedValueOnce(true) // currentPassword es correcta
        .mockResolvedValueOnce(true); // newPassword es igual a la actual

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'La nueva contraseña no puede ser igual a la actual.'
      });
    });

    it('debería manejar errores internos', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      mockReq.body = passwordData;
      User.findByPk.mockRejectedValue(new Error('Error de base de datos'));

      await userController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor al cambiar la contraseña.',
        details: 'Error de base de datos'
      });
    });
  });

  describe('updateProfile', () => {
    it('debería actualizar el perfil exitosamente', async () => {
      const profileData = {
        name: 'Juan Carlos Pérez',
        phone: '9876543210',
        address: 'Nueva Dirección 456'
      };

      const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '1234567890',
        address: 'Dirección Antigua',
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'Juan Carlos Pérez',
          email: 'juan@example.com',
          phone: '9876543210',
          address: 'Nueva Dirección 456'
        })
      };

      mockReq.body = profileData;
      User.findByPk.mockResolvedValue(mockUser);

      await userController.updateProfile(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.update).toHaveBeenCalledWith(profileData);
      expect(mockRes.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 1,
          name: 'Juan Carlos Pérez',
          email: 'juan@example.com',
          phone: '9876543210',
          address: 'Nueva Dirección 456'
        }),
        message: 'Perfil actualizado correctamente.'
      });
    });

    it('debería rechazar si el usuario no existe', async () => {
      const profileData = {
        name: 'Juan Carlos Pérez'
      };

      mockReq.body = profileData;
      User.findByPk.mockResolvedValue(null);

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });

    it('debería manejar errores internos', async () => {
      const profileData = {
        name: 'Juan Carlos Pérez'
      };

      mockReq.body = profileData;
      User.findByPk.mockRejectedValue(new Error('Error de base de datos'));

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error al actualizar perfil',
        details: 'Error de base de datos'
      });
    });
  });
}); 