const userService = require('../../services/user-service');
const bcrypt = require('bcrypt');

jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

const { User } = require('../../models');

describe('User Service', () => {
  beforeEach(() => {
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
      const result = await userService.getProfile(1);
      expect(User.findByPk).toHaveBeenCalledWith(1, { attributes: { exclude: ['password'] } });
      expect(result).toBe(mockUser);
    });
    it('debería lanzar error si el usuario no existe', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(userService.getProfile(99)).rejects.toThrow('Usuario no encontrado');
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
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare
        .mockResolvedValueOnce(true) // currentPassword es correcta
        .mockResolvedValueOnce(false); // newPassword es diferente
      bcrypt.hash.mockResolvedValue('hashedNewPassword');
      const result = await userService.changePassword(1, passwordData);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'hashedOldPassword');
      expect(bcrypt.compare).toHaveBeenCalledWith('newPassword123', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Contraseña actualizada correctamente.' });
    });
    it('debería lanzar error si el usuario no existe', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(userService.changePassword(99, { currentPassword: 'abcdef', newPassword: 'ghijkl' }))
        .rejects.toThrow('Usuario no encontrado.');
    });
    it('debería lanzar error si la contraseña actual es incorrecta', async () => {
      const mockUser = { id: 1, password: 'hashedOldPassword' };
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      await expect(userService.changePassword(1, { currentPassword: 'abcdef', newPassword: 'ghijkl' }))
        .rejects.toThrow('La contraseña actual es incorrecta.');
    });
    it('debería lanzar error si la nueva contraseña es igual a la actual', async () => {
      const mockUser = { id: 1, password: 'hashedSamePassword' };
      User.findByPk.mockResolvedValue(mockUser);
      bcrypt.compare
        .mockResolvedValueOnce(true) // currentPassword es correcta
        .mockResolvedValueOnce(true); // newPassword es igual a la actual
      await expect(userService.changePassword(1, { currentPassword: 'abcdef', newPassword: 'abcdef' }))
        .rejects.toThrow('La nueva contraseña no puede ser igual a la actual.');
    });
  });

  describe('updateProfile', () => {
    it('debería actualizar el perfil exitosamente', async () => {
      const updateData = { name: 'Nuevo Nombre', phone: '9876543210' };
      const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '1234567890',
        role: 'user',
        status: 'active',
        update: jest.fn().mockResolvedValue(),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'Nuevo Nombre',
          email: 'juan@example.com',
          phone: '9876543210',
          role: 'user',
          status: 'active'
        })
      };
      User.findByPk.mockResolvedValue(mockUser);
      const result = await userService.updateProfile(1, updateData);
      expect(mockUser.update).toHaveBeenCalledWith(updateData);
      expect(result.user).toEqual({
        id: 1,
        name: 'Nuevo Nombre',
        email: 'juan@example.com',
        phone: '9876543210',
        role: 'user',
        status: 'active'
      });
      expect(result.message).toBe('Perfil actualizado correctamente.');
    });
    it('debería lanzar error si el usuario no existe', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(userService.updateProfile(99, { name: 'Nombre', phone: '1234567890' }))
        .rejects.toThrow('Usuario no encontrado');
    });
  });
}); 