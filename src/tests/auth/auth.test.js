const authController = require('../../controllers/auth-controller');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock de los modelos
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

// Mock del mailer
jest.mock('../../utils/mailer', () => ({
  sendActivationEmail: jest.fn()
}));

// Mock de axios para reCAPTCHA
jest.mock('axios', () => ({
  post: jest.fn()
}));

const { User } = require('../../models');
const { sendActivationEmail } = require('../../utils/mailer');
const axios = require('axios');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    
    // Mock de reCAPTCHA exitoso
    axios.post.mockResolvedValue({
      data: { success: true }
    });
  });

  describe('registro', () => {
    it('debería registrar un usuario exitosamente', async () => {
      const userData = {
        name: 'Carlos Prueba',
        idNumber: '1234567890',
        email: 'carlos.prueba@example.com',
        password: 'password123',
        phone: '3001112233',
        address: 'Calle Falsa 123',
        birth_date: '1990-05-15',
        captchaToken: 'valid-captcha-token'
      };

      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        ...userData,
        password: hashedPassword,
        status: 'inactive',
        activation_code: 'ABC123',
        activation_expires_at: expect.any(Date),
        profile_picture: null,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: userData.name,
          email: userData.email,
          status: 'inactive',
          role: 'user'
        })
      };

      mockReq.body = userData;
      User.findOne.mockResolvedValue(null); // No existe usuario
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(createdUser);
      sendActivationEmail.mockResolvedValue(true);

      await authController.registro(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          [require('sequelize').Op.or]: [
            { id_number: userData.idNumber },
            { email: userData.email }
          ]
        }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        name: userData.name,
        id_number: userData.idNumber,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        address: userData.address,
        birth_date: expect.any(Date),
        status: 'inactive',
        role: 'user'
      }));
      expect(sendActivationEmail).toHaveBeenCalledWith(userData.email, expect.any(String));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Usuario registrado exitosamente. Revisa tu correo para activar tu cuenta.',
        user: expect.objectContaining({
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email
        })
      });
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
        captchaToken: 'valid-captcha-token'
      };

      mockReq.body = userData;
      User.findOne.mockResolvedValue({ id: 1, email: userData.email });

      await authController.registro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'El usuario ya existe con ese email o número de identificación'
      });
    });

    it('debería manejar errores internos', async () => {
      const userData = {
        name: 'Carlos Prueba',
        idNumber: '1234567890',
        email: 'carlos.prueba@example.com',
        password: 'password123',
        phone: '3001112233',
        address: 'Calle Falsa 123',
        birth_date: '1990-05-15',
        captchaToken: 'valid-captcha-token'
      };

      mockReq.body = userData;
      User.findOne.mockRejectedValue(new Error('Error de base de datos'));

      await authController.registro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error al registrar usuario',
        details: 'Error de base de datos'
      });
    });

    it('debería rechazar si reCAPTCHA falla', async () => {
      const userData = {
        name: 'Carlos Prueba',
        idNumber: '1234567890',
        email: 'carlos.prueba@example.com',
        password: 'password123',
        phone: '3001112233',
        address: 'Calle Falsa 123',
        birth_date: '1990-05-15',
        captchaToken: 'invalid-captcha-token'
      };

      // Mock de reCAPTCHA fallido
      axios.post.mockResolvedValue({
        data: { success: false }
      });

      mockReq.body = userData;

      await authController.registro(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Verificación de reCAPTCHA fallida. Intenta de nuevo.'
      });
    });
  });

  describe('activar', () => {
    it('debería activar cuenta con código válido', async () => {
      const activationData = {
        email: 'test@example.com',
        code: 'ABC123'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        status: 'inactive',
        activation_code: 'ABC123',
        activation_expires_at: new Date(Date.now() + 3600000), // 1 hora en el futuro
        save: jest.fn().mockResolvedValue(true)
      };

      mockReq.body = activationData;
      User.findOne.mockResolvedValue(user);

      await authController.activar(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: activationData.email, activation_code: activationData.code }
      });
      expect(user.status).toBe('active');
      expect(user.activation_code).toBeNull();
      expect(user.activation_expires_at).toBeNull();
      expect(user.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Cuenta activada correctamente'
      });
    });

    it('debería rechazar código expirado', async () => {
      const activationData = {
        email: 'test@example.com',
        code: 'ABC123'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        status: 'inactive',
        activation_code: 'ABC123',
        activation_expires_at: new Date(Date.now() - 1000), // 1 segundo en el pasado
        save: jest.fn()
      };

      mockReq.body = activationData;
      User.findOne.mockResolvedValue(user);

      await authController.activar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'El código de activación ha expirado. Por favor, solicita uno nuevo.'
      });
    });

    it('debería rechazar código inválido', async () => {
      const activationData = {
        email: 'test@example.com',
        code: 'INVALID'
      };

      mockReq.body = activationData;
      User.findOne.mockResolvedValue(null);

      await authController.activar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Código o correo incorrecto'
      });
    });
  });

  describe('login', () => {
    it('debería hacer login exitosamente', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'valid-captcha-token'
      };

      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        status: 'active',
        role: 'user',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          status: 'active',
          role: 'user'
        })
      };

      const mockToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockReq.body = loginData;
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken);

      await authController.login(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, user.password);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión exitoso',
        token: mockToken,
        refreshToken: mockRefreshToken,
        user: expect.objectContaining({
          id: user.id,
          name: user.name,
          email: user.email
        })
      });
    });

    it('debería rechazar usuario no encontrado', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
        captchaToken: 'valid-captcha-token'
      };

      mockReq.body = loginData;
      User.findOne.mockResolvedValue(null);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });

    it('debería rechazar contraseña incorrecta', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
        captchaToken: 'valid-captcha-token'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        status: 'active'
      };

      mockReq.body = loginData;
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Contraseña incorrecta'
      });
    });

    it('debería rechazar cuenta inactiva', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'valid-captcha-token'
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        status: 'inactive'
      };

      mockReq.body = loginData;
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Cuenta inactiva o bloqueada. Por favor, activa tu cuenta.'
      });
    });

    it('debería rechazar si reCAPTCHA falla', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'invalid-captcha-token'
      };

      // Mock de reCAPTCHA fallido
      axios.post.mockResolvedValue({
        data: { success: false }
      });

      mockReq.body = loginData;

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Verificación de reCAPTCHA fallida. Intenta de nuevo.'
      });
    });
  });

  describe('refreshToken', () => {
    it('debería refrescar token exitosamente', async () => {
      const refreshData = {
        refreshToken: 'valid.refresh.token'
      };

      const decodedToken = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active'
      };

      const mockNewToken = 'new.jwt.token';

      // Asegura que el token esté en el array global del controlador
      const { getRefreshTokens } = require('../../controllers/auth-controller');
      if (getRefreshTokens) {
        getRefreshTokens().push(refreshData.refreshToken);
      }

      mockReq.body = refreshData;
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedToken);
      });
      jwt.sign.mockReturnValue(mockNewToken);

      await authController.refreshToken(mockReq, mockRes);

      expect(jwt.verify).toHaveBeenCalledWith(refreshData.refreshToken, process.env.JWT_REFRESH_SECRET, expect.any(Function));
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: decodedToken.id,
          name: decodedToken.name,
          email: decodedToken.email,
          role: decodedToken.role,
          status: decodedToken.status
        }),
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockNewToken
      });
    });

    it('debería rechazar refresh token inválido', async () => {
      const refreshData = {
        refreshToken: 'invalid.refresh.token'
      };

      mockReq.body = refreshData;

      await authController.refreshToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Refresh token inválido'
      });
    });
  });

  describe('logout', () => {
    it('debería cerrar sesión exitosamente', async () => {
      const logoutData = {
        refreshToken: 'valid.refresh.token'
      };

      mockReq.body = logoutData;

      await authController.logout(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout exitoso'
      });
    });
  });
}); 