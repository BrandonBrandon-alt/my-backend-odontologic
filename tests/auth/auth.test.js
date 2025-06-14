const request = require("supertest");
const { User, sequelize } = require("../../models/user");
const express = require("express");
const authRouter = require("../../routers/auth");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../../utils/mailer");
const app = express();
app.use(express.json());
app.use("/", authRouter);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Auth endpoints", () => {
  let activationCode;

  // --- REGISTRO ---
  it("debe registrar correctamente un usuario válido", async () => {
    const response = await request(app).post("/registro").send({
      name: "Carlos",
      idNumber: "12345678",
      email: "carlos@example.com",
      password: "secreto123",
      phone: "1234567890",
    }, 15000);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Usuario registrado exitosamente");
    expect(response.body.user).toMatchObject({
      name: "Carlos",
      id_number: "12345678",
      email: "carlos@example.com",
      phone: "1234567890",
    });

    // Obtiene el código de activación de la base de datos
    const user = await User.findOne({ where: { email: "carlos@example.com" } });
    activationCode = user.activation_code;
    expect(activationCode).toBeDefined();
  });

  it("debe fallar si el usuario ya existe", async () => {
    const response = await request(app).post("/registro").send({
      name: "Carlos",
      idNumber: "12345678",
      email: "carlos@example.com",
      password: "secreto123",
      phone: "1234567890",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "El usuario ya existe con ese email o número de identificación"
    );
  });

  // --- ACTIVACIÓN DE CUENTA ---
  it("debe activar la cuenta correctamente", async () => {
    const response = await request(app).post("/activar").send({
      email: "carlos@example.com",
      code: activationCode,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Cuenta activada correctamente");
  });

  it("debe fallar si el código de activación es incorrecto", async () => {
    const response = await request(app).post("/activar").send({
      email: "carlos@example.com",
      code: "codigo_incorrecto",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Código o correo incorrecto");
  });

  // --- REENVÍO DE CÓDIGO DE ACTIVACIÓN ---
  it("debe reenviar el código de activación", async () => {
    // Cambia el usuario a inactivo para probar el reenvío
    await User.update(
      { status: "inactive" },
      { where: { email: "carlos@example.com" } }
    );

    const response = await request(app).post("/reenviar-activacion").send({
      email: "carlos@example.com",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Código de activación reenviado correctamente"
    );
  });

  it("debe fallar al reenviar si la cuenta ya está activada", async () => {
    // Activa la cuenta
    await User.update(
      { status: "active" },
      { where: { email: "carlos@example.com" } }
    );

    const response = await request(app).post("/reenviar-activacion").send({
      email: "carlos@example.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("La cuenta ya está activada");
  });

  // --- LOGIN ---
  it("debe iniciar sesión correctamente", async () => {
    const response = await request(app).post("/login").send({
      email: "carlos@example.com",
      password: "secreto123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Inicio de sesión exitoso");
    expect(response.body.user.email).toBe("carlos@example.com");
    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it("debe fallar el login si la contraseña es incorrecta", async () => {
    const response = await request(app).post("/login").send({
      email: "carlos@example.com",
      password: "secreto124",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Contraseña incorrecta");
  });

  it("debe fallar el login si el usuario no existe", async () => {
    const response = await request(app).post("/login").send({
      email: "noexiste@example.com",
      password: "secreto123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  // --- SOLICITUD DE CÓDIGO DE RECUPERACIÓN ---
  it("debe solicitar el código de recuperación correctamente", async () => {
    const response = await request(app).post("/solicitar-reset").send({
      email: "carlos@example.com",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Código de recuperación enviado correctamente");

    // Verifica que el código se guardó en la base de datos
    const user = await User.findOne({ where: { email: "carlos@example.com" } });
    expect(user.password_reset_code).toBeDefined();
    expect(user.password_reset_code.length).toBeGreaterThan(0);
  });

  it("debe fallar si el correo no existe", async () => {
    const response = await request(app).post("/solicitar-reset").send({
      email: "noexiste@example.com",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  it("debe fallar si no se envía el correo", async () => {
    const response = await request(app).post("/solicitar-reset").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("El correo es obligatorio");
  });

  // --- VERIFICACIÓN DE CÓDIGO DE RECUPERACIÓN ---
  it("debe verificar correctamente el código de recuperación", async () => {
    // Primero solicita el código de recuperación
    await request(app).post("/solicitar-reset").send({
      email: "carlos@example.com",
    });
    const user = await User.findOne({ where: { email: "carlos@example.com" } });

    const response = await request(app).post("/verificar-reset").send({
      email: "carlos@example.com",
      code: user.password_reset_code,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Código válido");
  });

  it("debe fallar si el código es incorrecto", async () => {
    const response = await request(app).post("/verificar-reset").send({
      email: "carlos@example.com",
      code: "codigo_incorrecto",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Código o correo incorrecto");
  });

  it("debe fallar si falta el correo o el código", async () => {
    const response = await request(app).post("/verificar-reset").send({
      email: "carlos@example.com",
      // Falta el código
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("El correo y el código son obligatorios");
  });

  // --- REENVÍO DE CÓDIGO DE RECUPERACIÓN ---
  it("debe reenviar el código de recuperación correctamente", async () => {
    // Asegúrate de que el usuario tenga un código
    await request(app).post("/solicitar-reset").send({
      email: "carlos@example.com",
    });

    const response = await request(app).post("/reenviar-reset").send({
      email: "carlos@example.com",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Código de recuperación reenviado correctamente");
  });

  it("debe fallar al reenviar si el correo no existe", async () => {
    const response = await request(app).post("/reenviar-reset").send({
      email: "noexiste@example.com",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  // --- CAMBIO DE CONTRASEÑA POR CÓDIGO DE RECUPERACIÓN ---
  it("debe cambiar la contraseña correctamente usando el código de recuperación", async () => {
    // Solicita el código de recuperación
    await request(app).post("/solicitar-reset").send({
      email: "carlos@example.com",
    });
    const user = await User.findOne({ where: { email: "carlos@example.com" } });

    const response = await request(app).post("/cambiar-password-reset").send({
      password_reset_code: user.password_reset_code,
      newPassword: "nuevaClave123",
      confirmNewPassword: "nuevaClave123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Contraseña actualizada correctamente");

    // Verifica que la contraseña realmente cambió
    const updatedUser = await User.findOne({ where: { email: "carlos@example.com" } });
    const isMatch = await require("bcrypt").compare("nuevaClave123", updatedUser.password);
    expect(isMatch).toBe(true);
  });

  it("debe fallar si el código de recuperación es inválido", async () => {
    const response = await request(app).post("/cambiar-password-reset").send({
      password_reset_code: "codigo_invalido",
      newPassword: "nuevaClave123",
      confirmNewPassword: "nuevaClave123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Código de recuperación inválido");
  });

  it("debe fallar si las contraseñas no coinciden", async () => {
    // Solicita el código de recuperación
    await request(app).post("/solicitar-reset").send({
      email: "carlos@example.com",
    });
    const user = await User.findOne({ where: { email: "carlos@example.com" } });

    const response = await request(app).post("/cambiar-password-reset").send({
      password_reset_code: user.password_reset_code,
      newPassword: "nuevaClave123",
      confirmNewPassword: "otraClave",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Las contraseñas no coinciden");
  });

});