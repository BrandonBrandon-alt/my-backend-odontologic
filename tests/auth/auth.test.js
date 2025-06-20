const request = require("supertest");
const { User, sequelize } = require("../../models/user");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const authModule = require("../../routers/auth");

const actualAuthRouter = authModule.router || authModule;
const getRefreshTokens = authModule.getRefreshTokens;
const clearRefreshTokens = authModule.clearRefreshTokens;

const app = express();
app.use(express.json());
app.use('/api', actualAuthRouter);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await User.destroy({ truncate: true, cascade: true });
  await sequelize.sync({ force: true });

  if (typeof clearRefreshTokens === 'function') {
    clearRefreshTokens();
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await sequelize.close();
});

describe("Auth endpoints", () => {
  describe("POST /registro", () => {
    const validUserData = {
      name: "Carlos Prueba",
      idNumber: "1234567890",
      email: "carlos.prueba@example.com",
      password: "password123",
      phone: "3001112233",
      address: "Calle Falsa 123",
      birth_date: "1990-05-15",
    };

    it("debe registrar correctamente un usuario válido", async () => {
      const response = await request(app).post("/api/registro").send(validUserData);

      expect(response.statusCode).toBe(201);
      expect(response.body.user).not.toHaveProperty('password');
      const userInDb = await User.findOne({ where: { email: validUserData.email } });
      expect(userInDb).toBeDefined();
    });

    it("debe fallar si el correo o número de identificación ya existe", async () => {
      await request(app).post("/api/registro").send(validUserData); // Create user via API first
      const response = await request(app).post("/api/registro").send(validUserData);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El usuario ya existe con ese email o número de identificación");
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(User, 'create').mockImplementation(() => {
        throw new Error("Simulated DB error");
      });

      const response = await request(app).post("/api/registro").send(validUserData);
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Error al registrar usuario');
    });
  });

  describe("POST /api/activar", () => {
    let userToActivate;
    beforeEach(async () => {
      userToActivate = await User.create({
        name: "Usuario Inactivo",
        id_number: "987654321",
        email: "inactive@example.com",
        password: await bcrypt.hash("inactivepass", 10),
        phone: "1122334455",
        status: "inactive",
        activation_code: "valid_activation_code",
        activation_expires_at: new Date(Date.now() + 60 * 60 * 1000),
      });
    });

    it("debe activar la cuenta con un código válido", async () => {
      const response = await request(app).post("/api/activar").send({
        email: userToActivate.email,
        code: userToActivate.activation_code,
      });
      expect(response.statusCode).toBe(200);
      const activatedUser = await User.findOne({ where: { email: userToActivate.email } });
      expect(activatedUser.status).toBe("active");
    });

    it("debe fallar si el código ha expirado", async () => {
      await userToActivate.update({ activation_expires_at: new Date(Date.now() - 1000) });
      const response = await request(app).post("/api/activar").send({
        email: userToActivate.email,
        code: userToActivate.activation_code,
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain("expirado");
    });
  });

  describe("POST /api/login", () => {
    let activeUser;
    const userCredentials = {
      email: "active@example.com",
      password: "activepassword",
    };

    beforeEach(async () => {
      activeUser = await User.create({
        name: "Usuario Activo",
        id_number: "100000000",
        email: userCredentials.email,
        password: await bcrypt.hash(userCredentials.password, 10),
        phone: "9988776655",
        status: "active",
      });
    });

    it("debe iniciar sesión correctamente y devolver tokens", async () => {
      const response = await request(app).post("/api/login").send(userCredentials);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refreshToken");
    });
    
    it("debe fallar si la cuenta está inactiva", async () => {
      await activeUser.update({ status: "inactive" });
      const response = await request(app).post("/api/login").send(userCredentials);
      expect(response.statusCode).toBe(403);
      expect(response.body.error).toContain("inactiva");
    });
  });

  describe("Token and Logout Endpoints", () => {
    let validRefreshToken;
    beforeEach(async () => {
      await User.create({
        id: 200,
        name: "Token User",
        email: "token.user@example.com",
        password: await bcrypt.hash("password", 10),
        id_number: "200200200",
        phone: "2002002000",
        status: "active",
      });
      
      const response = await request(app).post("/api/login").send({
          email: "token.user@example.com",
          password: "password",
      });
      validRefreshToken = response.body.refreshToken;
    });

    it("debe refrescar un access token con un refresh token válido", async () => {
      const response = await request(app)
        .post("/api/token")
        .send({ refreshToken: validRefreshToken });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("debe cerrar sesión y eliminar el refresh token", async () => {
      let refreshTokens = getRefreshTokens();
      expect(refreshTokens).toContain(validRefreshToken);

      const response = await request(app)
        .post("/api/logout")
        .send({ refreshToken: validRefreshToken });
        
      expect(response.statusCode).toBe(200);
      refreshTokens = getRefreshTokens();
      expect(refreshTokens).not.toContain(validRefreshToken);
    });
  });
});