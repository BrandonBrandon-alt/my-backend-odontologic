const request = require("supertest");
const { User, sequelize } = require("../../models/user");
const express = require("express");
const authRouter = require("../../routers/auth");

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

  it("debe registrar correctamente un usuario válido", async () => {
    const response = await request(app).post("/registro").send({
      name: "Carlos",
      idNumber: "12345678",
      email: "carlos@example.com",
      password: "secreto123",
      phone: "1234567890",
    });

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
});
