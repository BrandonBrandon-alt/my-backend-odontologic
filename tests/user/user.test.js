
const request = require("supertest");
const { User, sequelize } = require("../../models/user"); // ¡Verifica esta ruta!
const express = require("express");
const authRouter = require("../../routers/auth"); // Para el login, etc.
const userProfileRouter = require("../../routers/user"); // O el nombre del archivo donde esté tu nuevo router
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use('/api', authRouter); // Si también estás probando rutas de auth
app.use('/api', userProfileRouter); // Monta el router con los nuevos endpoints




// ======================= OBTENER PERFIL DE USUARIO =======================
describe("GET /api/perfil", () => {
  it("debe devolver el perfil del usuario autenticado", async () => {
    const response = await request(app)
      .get("/api/perfil")
      .set("Authorization", `Bearer ${activeUserToken}`); // Envía el token en la cabecera

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBe(activeUser.id);
    expect(response.body.user.name).toBe(activeUser.name);
    expect(response.body.user.email).toBe(activeUser.email);
    expect(response.body.user).not.toHaveProperty('password'); // Asegura que la contraseña no se expone
  });

  it("debe devolver 401 si no se proporciona token", async () => {
    const response = await request(app)
      .get("/api/perfil"); // No envía token

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Token de autenticación requerido."); // Mensaje de tu middleware authenticateToken
  });

  it("debe devolver 401 si el token es inválido", async () => {
    const response = await request(app)
      .get("/api/perfil")
      .set("Authorization", `Bearer invalid_token`);

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Token inválido."); // Mensaje de tu middleware authenticateToken
  });

  it("debe devolver 404 si el usuario no es encontrado (ej. ID del token no existe)", async () => {
    // Generar un token para un usuario que no existe
    const nonExistentUserToken = jwt.sign(
      { id: 99999, name: "Non Existent", email: "none@example.com", role: "user", status: "active" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const response = await request(app)
      .get("/api/perfil")
      .set("Authorization", `Bearer ${nonExistentUserToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  it("debe devolver 500 en caso de error interno del servidor", async () => {
    // Simular un error en la base de datos
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn(() => { throw new Error("DB profile error"); });

    const response = await request(app)
      .get("/api/perfil")
      .set("Authorization", `Bearer ${activeUserToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('error', 'Error al obtener perfil');
    expect(response.body).toHaveProperty('details', 'DB profile error');

    User.findByPk = originalFindByPk; // Restaurar el mock
  });
});

// ======================= CAMBIO DE CONTRASEÑA (AUTENTICADO) =======================
describe("POST /api/cambiar-password", () => {
  const newStrongPassword = "NewSecurePassword123!";

  it("debe cambiar la contraseña del usuario autenticado correctamente", async () => {
    const oldPasswordHash = activeUser.password; // Guarda el hash actual para verificar el cambio

    const response = await request(app)
      .post("/api/cambiar-password")
      .set("Authorization", `Bearer ${activeUserToken}`)
      .send({
        newPassword: newStrongPassword,
        confirmNewPassword: newStrongPassword // Asume que tu DTO lo requiere
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Contraseña actualizada correctamente.");

    // Verifica que la contraseña en la DB haya cambiado y sea la nueva
    const updatedUser = await User.findByPk(activeUser.id);
    expect(updatedUser).toBeDefined();
    expect(await bcrypt.compare(newStrongPassword, updatedUser.password)).toBe(true);
    expect(updatedUser.password).not.toBe(oldPasswordHash); // Asegura que el hash es diferente
  });

  it("debe devolver 400 si la validación del DTO falla (ej. nueva contraseña débil)", async () => {
    const response = await request(app)
      .post("/api/cambiar-password")
      .set("Authorization", `Bearer ${activeUserToken}`)
      .send({
        newPassword: "short", // Contraseña demasiado corta
        confirmNewPassword: "short"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error'); // Espera un mensaje de error de validación
  });

  it("debe devolver 401 si no se proporciona token", async () => {
    const response = await request(app)
      .post("/api/cambiar-password")
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Token de autenticación requerido.");
  });

  it("debe devolver 404 si el usuario no es encontrado (ID del token no existe)", async () => {
    // Generar un token para un usuario que no existe
    const nonExistentUserToken = jwt.sign(
      { id: 99999, name: "Non Existent", email: "none@example.com", role: "user", status: "active" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const response = await request(app)
      .post("/api/cambiar-password")
      .set("Authorization", `Bearer ${nonExistentUserToken}`)
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  it("debe devolver 500 en caso de error interno del servidor", async () => {
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn(() => { throw new Error("DB change password error"); });

    const response = await request(app)
      .post("/api/cambiar-password")
      .set("Authorization", `Bearer ${activeUserToken}`)
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('error', 'Error al cambiar la contraseña');
    expect(response.body).toHaveProperty('details', 'DB change password error');

    User.findByPk = originalFindByPk; // Restaurar el mock
  });
});

// ======================= ACTUALIZAR PERFIL (AUTENTICADO) =======================
describe("PATCH /api/perfil", () => {
  it("debe actualizar correctamente los campos del perfil del usuario", async () => {
    const updates = {
      name: "Carlos Actualizado",
      email: "carlos.updated@example.com",
      phone: "9998887766",
    };

    const response = await request(app)
      .patch("/api/perfil")
      .set("Authorization", `Bearer ${activeUserToken}`)
      .send(updates);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe(updates.name);
    expect(response.body.user.email).toBe(updates.email);
    expect(response.body.user.phone).toBe(updates.phone);
    expect(response.body.user.id).toBe(activeUser.id);
    expect(response.body.user).not.toHaveProperty('password'); // Asegura que la contraseña no se expone

    // Verificar en la DB
    const updatedUserInDb = await User.findByPk(activeUser.id);
    expect(updatedUserInDb.name).toBe(updates.name);
    expect(updatedUserInDb.email).toBe(updates.email);
    expect(updatedUserInDb.phone).toBe(updates.phone);
  });

  it("debe devolver 400 si la validación del DTO falla", async () => {
    const invalidUpdates = {
      email: "invalid-email", // Formato de email inválido
    };

    const response = await request(app)
      .patch("/api/perfil")
      .set("Authorization", `Bearer ${activeUserToken}`)
      .send(invalidUpdates);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it("debe devolver 401 si no se proporciona token", async () => {
    const response = await request(app)
      .patch("/api/perfil")
      .send({ name: "Nuevo Nombre" });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("Token de autenticación requerido.");
  });

  it("debe devolver 404 si el usuario no es encontrado (ID del token no existe)", async () => {
    const nonExistentUserToken = jwt.sign(
      { id: 99999, name: "Non Existent", email: "none@example.com", role: "user", status: "active" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const response = await request(app)
      .patch("/api/perfil")
      .set("Authorization", `Bearer ${nonExistentUserToken}`)
      .send({ name: "Nuevo Nombre" });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Usuario no encontrado");
  });

  it("debe devolver 500 en caso de error interno del servidor", async () => {
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn(() => { throw new Error("DB update profile error"); });

    const response = await request(app)
      .patch("/api/perfil")
      .set("Authorization", `Bearer ${activeUserToken}`)
      .send({ name: "Nombre temporal" });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('error', 'Error al actualizar perfil');
    expect(response.body).toHaveProperty('details', 'DB update profile error');

    User.findByPk = originalFindByPk; // Restaurar el mock
  });
});