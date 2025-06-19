// __tests__/auth.test.js
const request = require("supertest");
const { User, sequelize } = require("../../models/user");
const express = require("express");
const authRouter = require("../../routers/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Carga las variables de entorno para JWT_SECRET, JWT_REFRESH_SECRET
require("dotenv").config();

const app = express();
app.use(express.json());
app.use('/api', authRouter);

// Accede a las funciones de testing exportadas por el router
const { clearRefreshTokens, getRefreshTokens } = authRouter;


// --- Setup y Teardown de la base de datos ---
beforeAll(async () => {
  // Sincroniza la base de datos y fuerza la recreación de tablas al inicio de la suite
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  // Limpia la base de datos y recrea las tablas antes de CADA test para asegurar aislamiento
  await User.destroy({ truncate: true, cascade: true });
  await sequelize.sync({ force: true }); // Asegura que el esquema esté fresco

  // Limpia el array de refreshTokens antes de cada test
  if (typeof clearRefreshTokens === 'function') {
    clearRefreshTokens();
  } else {
    // Fallback por si la exportación condicional no funcionó por alguna razón
    if (getRefreshTokens && Array.isArray(getRefreshTokens())) {
      getRefreshTokens().length = 0;
    }
  }
});

afterAll(async () => {
  // Cierra la conexión de la base de datos después de todos los tests
  await sequelize.close();
});

// --- Suite de Tests para Endpoints de Autenticación ---
describe("Auth endpoints", () => {
  let activationCode = '';
  let resetCode = '';

  // ======================= REGISTRO =======================
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

    it("debe registrar correctamente un usuario válido y enviar email de activación", async () => {
      const response = await request(app).post("/api/registro").send(validUserData);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe("Usuario registrado exitosamente. Revisa tu correo para activar tu cuenta.");
      expect(response.body.user).toMatchObject({
        name: validUserData.name,
        id_number: validUserData.idNumber,
        email: validUserData.email,
        phone: validUserData.phone,
        address: validUserData.address,
        role: "user",
        status: "inactive",
      });
      expect(response.body.user).not.toHaveProperty('password');

      const userInDb = await User.findOne({ where: { email: validUserData.email } });
      expect(userInDb).toBeDefined();
      expect(userInDb.activation_code).toBeDefined();
      expect(userInDb.activation_expires_at).toBeDefined();
      activationCode = userInDb.activation_code;
    });

    it("debe fallar si el correo o número de identificación ya existe", async () => {
      // Registrar un usuario primero para que el siguiente intento falle
      await request(app).post("/api/registro").send(validUserData); // Este es un pre-requisito

      const response = await request(app).post("/api/registro").send(validUserData);

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El usuario ya existe con ese email o número de identificación");
    });

    it("debe fallar si faltan campos requeridos (ej. email)", async () => {
      const invalidData = { ...validUserData, email: "" };
      const response = await request(app).post("/api/registro").send(invalidData);
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it("debe devolver 500 en caso de error interno del servidor (ej. DB down)", async () => {
      const originalCreate = User.create;
      User.create = jest.fn(() => { throw new Error("Simulated DB error"); });

      const response = await request(app).post("/api/registro").send(validUserData);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al registrar usuario');
      expect(response.body).toHaveProperty('details', 'Simulated DB error');

      User.create = originalCreate;
    });
  });

  // ======================= ACTIVACIÓN DE CUENTA =======================
  describe("POST /api/activar", () => {
    let userToActivate;
    let codeToActivate;
    beforeEach(async () => {
      userToActivate = await User.create({
        name: "Usuario Inactivo",
        id_number: "987654321",
        email: "inactive@example.com",
        password: await bcrypt.hash("inactivepass", 10),
        phone: "1112223344",
        role: "user",
        status: "inactive",
        activation_code: "valid_activation_code",
        activation_expires_at: new Date(Date.now() + 60 * 60 * 1000), // Válido por 1 hora
      });
      codeToActivate = userToActivate.activation_code;
    });

    it("debe activar la cuenta correctamente con un código válido", async () => {
      const response = await request(app).post("/api/activar").send({
        email: userToActivate.email,
        code: codeToActivate,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Cuenta activada correctamente");

      const activatedUser = await User.findOne({ where: { email: userToActivate.email } });
      expect(activatedUser.status).toBe("active");
      expect(activatedUser.activation_code).toBeNull();
      expect(activatedUser.activation_expires_at).toBeNull();
    });

    it("debe fallar si el código de activación es incorrecto", async () => {
      const response = await request(app).post("/api/activar").send({
        email: userToActivate.email,
        code: "wrong_code",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Código o correo incorrecto");
    });

    it("debe fallar si el código de activación ha expirado", async () => {
      await userToActivate.update({ activation_expires_at: new Date(Date.now() - 1000) });

      const response = await request(app).post("/api/activar").send({
        email: userToActivate.email,
        code: codeToActivate,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El código de activación ha expirado. Por favor, solicita uno nuevo.");
    });

    it("debe fallar si el correo no coincide con el código", async () => {
      const response = await request(app).post("/api/activar").send({
        email: "nonexistent@example.com",
        code: codeToActivate,
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Código o correo incorrecto");
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB read error"); });

      const response = await request(app).post("/api/activar").send({
        email: userToActivate.email,
        code: codeToActivate,
      });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al activar cuenta');
      expect(response.body).toHaveProperty('details', 'DB read error');

      User.findOne = originalFindOne;
    });
  });

  // ======================= LOGIN =======================
  describe("POST /api/login", () => {
    const userCredentials = {
      email: "active@example.com",
      password: "activepassword",
    };
    let activeUser;

    beforeEach(async () => {
      activeUser = await User.create({
        id: 100, // ID fijo para el payload del token
        name: "Usuario Activo",
        id_number: "100000000",
        email: userCredentials.email,
        password: await bcrypt.hash(userCredentials.password, 10),
        phone: "9998887766",
        role: "user",
        status: "active",
      });
    });

    it("debe fallar el login si la contraseña es incorrecta", async () => {
      const response = await request(app).post("/api/login").send({
        email: userCredentials.email,
        password: "wrongpassword",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Contraseña incorrecta");
    });

    it("debe fallar el login si el usuario no existe", async () => {
      const response = await request(app).post("/api/login").send({
        email: "nonexistent@example.com",
        password: "anypassword",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Usuario no encontrado");
    });

    it("debe fallar el login si la cuenta está inactiva", async () => {
      await activeUser.update({ status: "inactive" }); // Cambiar estado a inactivo

      const response = await request(app).post("/api/login").send(userCredentials);

      expect(response.statusCode).toBe(403);
      expect(response.body.error).toBe("Cuenta inactiva o bloqueada. Por favor, activa tu cuenta.");
    });

    it("debe devolver 400 si la validación del DTO falla", async () => {
      const response = await request(app).post("/api/login").send({ email: "invalid-email" }); // Email inválido

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error'); // El mensaje exacto depende de tu DTO
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB login error"); });

      const response = await request(app).post("/api/login").send(userCredentials);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error en el login');
      expect(response.body).toHaveProperty('details', 'DB login error');

      User.findOne = originalFindOne;
    });
  });

  // ======================= REENVÍO DE CÓDIGO DE ACTIVACIÓN =======================
  describe("POST /api/reenviar-activacion", () => {
    let inactiveUser;
    beforeEach(async () => {
      inactiveUser = await User.create({
        name: "Inactivo Resend",
        id_number: "222333444",
        email: "resend@example.com",
        password: await bcrypt.hash("resendpass", 10),
        phone: "4445556677",
        role: "user",
        status: "inactive",
        activation_code: "old_activation_code",
        activation_expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // Expirado hace 24 horas
      });
    });

    it("debe reenviar un nuevo código de activación correctamente", async () => {
      const response = await request(app).post("/api/reenviar-activacion").send({ email: inactiveUser.email });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Código de activación reenviado correctamente. Revisa tu correo.");

      const updatedUser = await User.findOne({ where: { email: inactiveUser.email } });
      expect(updatedUser.activation_code).not.toBe(inactiveUser.activation_code);
      expect(updatedUser.activation_expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it("debe fallar si el correo no existe", async () => {
      const response = await request(app).post("/api/reenviar-activacion").send({ email: "nonexistent@example.com" });

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("Usuario no encontrado");
    });

    it("debe fallar si la cuenta ya está activada", async () => {
      await inactiveUser.update({ status: "active" });

      const response = await request(app).post("/api/reenviar-activacion").send({ email: inactiveUser.email });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("La cuenta ya está activada");
    });

    it("debe devolver 400 si el correo no es proporcionado", async () => {
      const response = await request(app).post("/api/reenviar-activacion").send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El correo es obligatorio");
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB resend activation error"); });

      const response = await request(app).post("/api/reenviar-activacion").send({ email: inactiveUser.email });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al reenviar código');
      expect(response.body).toHaveProperty('details', 'DB resend activation error');

      User.findOne = originalFindOne;
    });
  });

  // ======================= SOLICITUD DE CÓDIGO DE RECUPERACIÓN =======================
  describe("POST /api/solicitar-reset", () => {
    let userForReset;
    beforeEach(async () => {
      userForReset = await User.create({
        name: "Reset User",
        id_number: "333444555",
        email: "reset@example.com",
        password: await bcrypt.hash("resetpass", 10),
        phone: "5556667788",
        role: "user",
        status: "active",
      });
    });

    it("debe solicitar el código de recuperación correctamente y enviarlo por email", async () => {
      const response = await request(app).post("/api/solicitar-reset").send({ email: userForReset.email });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Código de recuperación enviado correctamente. Revisa tu correo.");

      const updatedUser = await User.findOne({ where: { email: userForReset.email } });
      expect(updatedUser.password_reset_code).toBeDefined();
      expect(updatedUser.password_reset_expires_at.getTime()).toBeGreaterThan(Date.now());
      resetCode = updatedUser.password_reset_code;
    });

    it("debe fallar si el correo no existe", async () => {
      const response = await request(app).post("/api/solicitar-reset").send({ email: "nonexistent@example.com" });

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("Usuario no encontrado");
    });

    it("debe devolver 400 si el correo no es proporcionado", async () => {
      const response = await request(app).post("/api/solicitar-reset").send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El correo es obligatorio");
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB request reset error"); });

      const response = await request(app).post("/api/solicitar-reset").send({ email: userForReset.email });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al solicitar recuperación');
      expect(response.body).toHaveProperty('details', 'DB request reset error');

      User.findOne = originalFindOne;
    });
  });

  // ======================= REENVÍO DE CÓDIGO DE RECUPERACIÓN =======================
  describe("POST /api/reenviar-reset", () => {
    let userToResendReset;
    beforeEach(async () => {
      userToResendReset = await User.create({
        name: "Resend Reset User",
        id_number: "444555666",
        email: "resendreset@example.com",
        password: await bcrypt.hash("resendresetpass", 10),
        phone: "6667778899",
        role: "user",
        status: "active",
        password_reset_code: "old_reset_code",
        password_reset_expires_at: new Date(Date.now() - 1000 * 60 * 60), // Expirado
      });
    });

    it("debe reenviar un nuevo código de recuperación correctamente", async () => {
      const response = await request(app).post("/api/reenviar-reset").send({ email: userToResendReset.email });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Código de recuperación reenviado correctamente. Revisa tu correo.");

      const updatedUser = await User.findOne({ where: { email: userToResendReset.email } });
      expect(updatedUser.password_reset_code).not.toBe(userToResendReset.password_reset_code);
      expect(updatedUser.password_reset_expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it("debe fallar si el correo no existe", async () => {
      const response = await request(app).post("/api/reenviar-reset").send({ email: "nonexistent@example.com" });

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("Usuario no encontrado");
    });

    it("debe devolver 400 si el correo no es proporcionado", async () => {
      const response = await request(app).post("/api/reenviar-reset").send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El correo es obligatorio");
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB resend reset error"); });

      const response = await request(app).post("/api/reenviar-reset").send({ email: userToResendReset.email });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al reenviar código de recuperación');
      expect(response.body).toHaveProperty('details', 'DB resend reset error');

      User.findOne = originalFindOne;
    });
  });

  // ======================= CAMBIO DE CONTRASEÑA POR CÓDIGO DE RECUPERACIÓN =======================
  describe("POST /api/cambiar-password-reset", () => {
    let userForPasswordChange;
    let validResetCode;

    beforeEach(async () => {
      userForPasswordChange = await User.create({
        name: "Change Pass User",
        id_number: "777888999",
        email: "changepass@example.com",
        password: await bcrypt.hash("oldpassword", 10),
        phone: "1122334455",
        role: "user",
        status: "active",
        password_reset_code: "change_me_code",
        password_reset_expires_at: new Date(Date.now() + 60 * 60 * 1000), // Válido
      });
      validResetCode = userForPasswordChange.password_reset_code;
    });

    it("debe cambiar la contraseña correctamente usando un código válido", async () => {
      const newPassword = "newStrongPassword123";
      const response = await request(app).post("/api/cambiar-password-reset").send({
        password_reset_code: validResetCode,
        newPassword: newPassword,
        confirmNewPassword: newPassword, // *** AÑADIDO: campo de confirmación ***
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Contraseña actualizada correctamente");

      const updatedUser = await User.findOne({ where: { email: userForPasswordChange.email } });
      expect(await bcrypt.compare(newPassword, updatedUser.password)).toBe(true);
      expect(updatedUser.password_reset_code).toBeNull();
      expect(updatedUser.password_reset_expires_at).toBeNull();
    });

    it("debe fallar si el código de recuperación es inválido o ya fue utilizado", async () => {
      const response = await request(app).post("/api/cambiar-password-reset").send({
        password_reset_code: "invalid_or_used_code",
        newPassword: "newStrongPassword123",
        confirmNewPassword: "newStrongPassword123", // *** AÑADIDO: campo de confirmación ***
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Código de recuperación inválido o ya utilizado");
    });

    it("debe fallar si el código de recuperación ha expirado", async () => {
      await userForPasswordChange.update({ password_reset_expires_at: new Date(Date.now() - 1000) }); // Expirado

      const response = await request(app).post("/api/cambiar-password-reset").send({
        password_reset_code: validResetCode,
        newPassword: "newStrongPassword123",
        confirmNewPassword: "newStrongPassword123", // *** AÑADIDO: campo de confirmación ***
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El código de recuperación ha expirado. Por favor, solicita uno nuevo.");
    });

    it("debe devolver 400 si la validación del DTO falla (ej. nueva contraseña no cumple requisitos)", async () => {
      const response = await request(app).post("/api/cambiar-password-reset").send({
        password_reset_code: validResetCode,
        newPassword: "short", // Asume que tu DTO tiene una longitud mínima
        confirmNewPassword: "short", // *** AÑADIDO: campo de confirmación ***
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error'); // El mensaje exacto depende de tu DTO
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB password change error"); });

      const response = await request(app).post("/api/cambiar-password-reset").send({
        password_reset_code: validResetCode,
        newPassword: "newStrongPassword123",
        confirmNewPassword: "newStrongPassword123", // *** AÑADIDO: campo de confirmación ***
      });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al cambiar contraseña');
      expect(response.body).toHaveProperty('details', 'DB password change error');

      User.findOne = originalFindOne;
    });
  });

  // ======================= VERIFICAR CÓDIGO DE RECUPERACIÓN =======================
  describe("POST /api/verificar-reset", () => {
    let userToVerify;
    let codeToVerify;

    beforeEach(async () => {
      userToVerify = await User.create({
        name: "Verify User",
        id_number: "000111222",
        email: "verify@example.com",
        password: await bcrypt.hash("verifypass", 10),
        phone: "2233445566",
        role: "user",
        status: "active",
        password_reset_code: "verify_code",
        password_reset_expires_at: new Date(Date.now() + 60 * 60 * 1000), // Válido
      });
      codeToVerify = userToVerify.password_reset_code;
    });

    it("debe verificar el código de recuperación correctamente", async () => {
      const response = await request(app).post("/api/verificar-reset").send({
        email: userToVerify.email,
        code: codeToVerify,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Código válido");
    });

    it("debe fallar si el código o correo son incorrectos", async () => {
      const response = await request(app).post("/api/verificar-reset").send({
        email: userToVerify.email,
        code: "incorrect_code",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Código o correo incorrecto");
    });

    it("debe fallar si el código de recuperación ha expirado", async () => {
      await userToVerify.update({ password_reset_expires_at: new Date(Date.now() - 1000) }); // Expirado

      const response = await request(app).post("/api/verificar-reset").send({
        email: userToVerify.email,
        code: codeToVerify,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El código de recuperación ha expirado. Por favor, solicita uno nuevo.");
    });

    it("debe devolver 400 si falta el correo o el código", async () => {
      const response = await request(app).post("/api/verificar-reset").send({ email: userToVerify.email }); // Falta el código
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("El correo y el código son obligatorios");

      const response2 = await request(app).post("/api/verificar-reset").send({ code: codeToVerify }); // Falta el email
      expect(response2.statusCode).toBe(400);
      expect(response2.body.error).toBe("El correo y el código son obligatorios");
    });

    it("debe devolver 500 en caso de error interno del servidor", async () => {
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => { throw new Error("DB verify error"); });

      const response = await request(app).post("/api/verificar-reset").send({
        email: userToVerify.email,
        code: codeToVerify,
      });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error al verificar el código');
      expect(response.body).toHaveProperty('details', 'DB verify error');

      User.findOne = originalFindOne;
    });
  });

});
