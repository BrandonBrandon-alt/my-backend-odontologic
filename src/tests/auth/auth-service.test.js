const authService = require('../../services/auth-service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  RefreshToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn()
  }
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

jest.mock('../../utils/mailer', () => ({
  sendActivationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

jest.mock('axios', () => ({
  post: jest.fn()
}));

const { User, RefreshToken } = require('../../models');
const { sendActivationEmail } = require('../../utils/mailer');
const axios = require('axios');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      const userData = {
        name: 'Carlos Prueba',
        idNumber: '1234567890',
        email: 'carlos.prueba@example.com',
        password: 'password123',
        phone: '3001112233',
        address: 'Calle Falsa 123',
        birth_date: '1990-05-15',
        captchaToken: 'test-captcha'
      };
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        ...userData,
        password: hashedPassword,
        status: 'inactive',
        activation_code: 'ABC123',
        activation_expires_at: new Date(),
        profile_picture: null,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: userData.name,
          email: userData.email,
          status: 'inactive',
          role: 'user'
        })
      };
      User.findOne.mockResolvedValue(null); // No existe usuario
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(createdUser);
      sendActivationEmail.mockResolvedValue(true);
      const result = await authService.register(userData);
      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User.create).toHaveBeenCalled();
      expect(sendActivationEmail).toHaveBeenCalledWith(userData.email, expect.any(String));
      expect(result.success).toBe(true);
      expect(result.user).toEqual(expect.objectContaining({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email
      }));
    });
    it('debería rechazar registro si el usuario ya existe', async () => {
      const userData = {
        name: 'Carlos Prueba',
        idNumber: '1234567890',
        email: 'carlos.prueba@example.com',
        password: 'password123',
        phone: '3001112233',
        address: 'Calle Falsa 123',
        birth_date: '1990-05-15',
        captchaToken: 'test-captcha'
      };
      User.findOne.mockResolvedValue({ id: 1, email: userData.email });
      await expect(authService.register(userData)).rejects.toThrow('El usuario ya existe con ese email o número de identificación');
    });
  });

  describe('login', () => {
    it('debería iniciar sesión exitosamente', async () => {
      const userData = {
        email: 'carlos.prueba@example.com',
        password: 'password123',
        captchaToken: 'test-captcha'
      };
      const user = {
        id: 1,
        name: 'Carlos Prueba',
        email: userData.email,
        password: 'hashedPassword123',
        status: 'active',
        role: 'user',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'Carlos Prueba',
          email: userData.email,
          status: 'active',
          role: 'user'
        })
      };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      RefreshToken.create.mockResolvedValue({});
      const result = await authService.login(userData);
      expect(result.token).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual(expect.objectContaining({ id: 1, email: userData.email }));
    });
    it('debería rechazar login con credenciales inválidas', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.login({ email: 'no@existe.com', password: '123456', captchaToken: 'test-captcha' })).rejects.toThrow('Credenciales inválidas');
    });
    it('debería rechazar login con contraseña incorrecta', async () => {
      const user = { id: 1, email: 'carlos.prueba@example.com', password: 'hashed', status: 'active', role: 'user' };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);
      await expect(authService.login({ email: user.email, password: 'wrongpass', captchaToken: 'test-captcha' })).rejects.toThrow('Credenciales inválidas');
    });
    it('debería rechazar login si la cuenta está inactiva', async () => {
      const user = { id: 1, email: 'carlos.prueba@example.com', password: 'hashed', status: 'inactive', role: 'user' };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      await expect(authService.login({ email: user.email, password: 'password123', captchaToken: 'test-captcha' })).rejects.toThrow('Cuenta inactiva o bloqueada. Por favor, activa tu cuenta.');
    });
  });

  describe('refreshToken', () => {
    it('debería refrescar el token exitosamente', async () => {
      const token = 'refresh-token';
      const dbToken = { token, expires_at: new Date(Date.now() + 10000), destroy: jest.fn() };
      RefreshToken.findOne.mockResolvedValue(dbToken);
      jwt.verify.mockImplementation((t, secret, cb) => cb(null, { id: 1, name: 'Carlos', email: 'carlos@x.com', role: 'user', status: 'active' }));
      jwt.sign.mockReturnValueOnce('new-access-token');
      const result = await authService.refreshToken(token);
      expect(result.token).toBe('new-access-token');
    });
    it('debería rechazar si el refresh token no existe', async () => {
      RefreshToken.findOne.mockResolvedValue(null);
      await expect(authService.refreshToken('invalid')).rejects.toThrow('Refresh token inválido');
    });
    it('debería rechazar si el refresh token está expirado', async () => {
      const dbToken = { token: 'refresh-token', expires_at: new Date(Date.now() - 10000), destroy: jest.fn() };
      RefreshToken.findOne.mockResolvedValue(dbToken);
      await expect(authService.refreshToken('refresh-token')).rejects.toThrow('Refresh token expirado');
    });
  });

  describe('logout', () => {
    it('debería hacer logout exitosamente', async () => {
      RefreshToken.destroy.mockResolvedValue(1);
      const result = await authService.logout('refresh-token');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout exitoso');
    });
  });

  describe('activateAccount', () => {
    it('debería activar la cuenta exitosamente', async () => {
      const user = { id: 1, email: 'carlos@x.com', activation_code: 'ABC123', activation_expires_at: new Date(Date.now() + 10000), status: 'inactive', save: jest.fn().mockResolvedValue() };
      User.findOne.mockResolvedValue(user);
      const result = await authService.activateAccount({ email: user.email, code: 'ABC123' });
      expect(user.save).toHaveBeenCalled();
      expect(result.message).toBe('Cuenta activada correctamente');
    });
    it('debería rechazar si el código es incorrecto', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.activateAccount({ email: 'carlos@x.com', code: 'WRONG' })).rejects.toThrow('Código o correo incorrecto');
    });
    it('debería rechazar si el código está expirado', async () => {
      const user = { id: 1, email: 'carlos@x.com', activation_code: 'ABC123', activation_expires_at: new Date(Date.now() - 10000), status: 'inactive', save: jest.fn() };
      User.findOne.mockResolvedValue(user);
      await expect(authService.activateAccount({ email: user.email, code: 'ABC123' })).rejects.toThrow('El código de activación ha expirado. Por favor, solicita uno nuevo.');
    });
  });

  describe('resendActivationCode', () => {
    it('debería reenviar el código de activación', async () => {
      const user = { id: 1, email: 'carlos@x.com', status: 'inactive', save: jest.fn().mockResolvedValue() };
      User.findOne.mockResolvedValue(user);
      sendActivationEmail.mockResolvedValue(true);
      const result = await authService.resendActivationCode({ email: user.email });
      expect(sendActivationEmail).toHaveBeenCalled();
      expect(result.message).toBe('Código de activación reenviado correctamente. Revisa tu correo.');
    });
    it('debería rechazar si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.resendActivationCode({ email: 'no@existe.com' })).rejects.toThrow('Usuario no encontrado');
    });
    it('debería rechazar si la cuenta ya está activada', async () => {
      const user = { id: 1, email: 'carlos@x.com', status: 'active', save: jest.fn() };
      User.findOne.mockResolvedValue(user);
      await expect(authService.resendActivationCode({ email: user.email })).rejects.toThrow('La cuenta ya está activada');
    });
  });

  describe('requestPasswordReset', () => {
    it('debería enviar código de recuperación', async () => {
      const user = { id: 1, email: 'carlos@x.com', save: jest.fn().mockResolvedValue() };
      User.findOne.mockResolvedValue(user);
      const sendPasswordResetEmail = require('../../utils/mailer').sendPasswordResetEmail;
      sendPasswordResetEmail.mockResolvedValue(true);
      const result = await authService.requestPasswordReset({ email: user.email });
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toBe('Código de recuperación enviado correctamente. Revisa tu correo.');
    });
    it('debería rechazar si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.requestPasswordReset({ email: 'no@existe.com' })).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('resendPasswordReset', () => {
    it('debería reenviar código de recuperación', async () => {
      const user = { id: 1, email: 'carlos@x.com', save: jest.fn().mockResolvedValue() };
      User.findOne.mockResolvedValue(user);
      const sendPasswordResetEmail = require('../../utils/mailer').sendPasswordResetEmail;
      sendPasswordResetEmail.mockResolvedValue(true);
      const result = await authService.resendPasswordReset({ email: user.email });
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toBe('Código de recuperación reenviado correctamente. Revisa tu correo.');
    });
    it('debería rechazar si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.resendPasswordReset({ email: 'no@existe.com' })).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('resetPassword', () => {
    it('debería resetear la contraseña exitosamente', async () => {
      const user = { id: 1, password_reset_code: 'CODE123', password_reset_expires_at: new Date(Date.now() + 10000), save: jest.fn().mockResolvedValue() };
      User.findOne.mockResolvedValue(user);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');
      const result = await authService.resetPassword({ password_reset_code: 'CODE123', newPassword: 'newPassword123' });
      expect(user.save).toHaveBeenCalled();
      expect(result.message).toBe('Contraseña actualizada correctamente');
    });
    it('debería rechazar si el código es inválido', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.resetPassword({ password_reset_code: 'INVALID', newPassword: 'newPassword123' })).rejects.toThrow('Código de recuperación inválido o ya utilizado');
    });
    it('debería rechazar si el código está expirado', async () => {
      const user = { id: 1, password_reset_code: 'CODE123', password_reset_expires_at: new Date(Date.now() - 10000), save: jest.fn() };
      User.findOne.mockResolvedValue(user);
      await expect(authService.resetPassword({ password_reset_code: 'CODE123', newPassword: 'newPassword123' })).rejects.toThrow('El código de recuperación ha expirado. Por favor, solicita uno nuevo.');
    });
  });

  describe('verifyResetCode', () => {
    it('debería verificar el código de recuperación exitosamente', async () => {
      const user = { id: 1, email: 'carlos@x.com', password_reset_code: 'CODE123', password_reset_expires_at: new Date(Date.now() + 10000) };
      User.findOne.mockResolvedValue(user);
      const result = await authService.verifyResetCode({ email: user.email, code: 'CODE123' });
      expect(result.message).toBe('Código válido');
    });
    it('debería rechazar si el usuario no existe o el código es incorrecto', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.verifyResetCode({ email: 'no@existe.com', code: 'INVALID' })).rejects.toThrow('Código o correo incorrecto');
    });
    it('debería rechazar si el código está expirado', async () => {
      const user = { id: 1, email: 'carlos@x.com', password_reset_code: 'CODE123', password_reset_expires_at: new Date(Date.now() - 10000) };
      User.findOne.mockResolvedValue(user);
      await expect(authService.verifyResetCode({ email: user.email, code: 'CODE123' })).rejects.toThrow('El código de recuperación ha expirado. Por favor, solicita uno nuevo.');
    });
  });
}); 