// tests/user/user.test.js

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Carga variables de entorno

// Importa el router que vas a testear
const userRoutes = require('../../routers/user');

// Importa el middleware de autenticación
const { authenticateToken } = require('../../middleware/authMiddleware');

// =========================================================================
// NO MOCKING DEL MODELO USER Y SEQUELIZE - USAMOS LA DB REAL (DE TESTING)
// =========================================================================
const { User, sequelize } = require('../../models/user'); // Importa el modelo REAL y la instancia de sequelize

// Importa los DTOs reales
const ChangedPasswordDTO = require('../../dto/ChangedPasswordDTO');
const UpdateProfileDTO = require('../../dto/updateProfileDTO');

// Crea una aplicación Express para testear el router
const app = express();
app.use(express.json()); // Necesario para parsear body JSON

// Monta el router de usuario en la aplicación
app.use('/api', userRoutes);

// Variables para el usuario activo y su token
let activeUser; // Este será el usuario REAL de la DB
let activeUserToken;

// ======================= CONFIGURACIÓN DE TESTS =======================

beforeAll(async () => {
  // Sincroniza la base de datos y fuerza la recreación de tablas al inicio de la suite
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  // Limpia la base de datos y recrea las tablas antes de CADA test para asegurar aislamiento
  await User.destroy({ truncate: true, cascade: true }); // Limpia todos los datos
  await sequelize.sync({ force: true }); // Asegura que el esquema esté fresco

  // Crea un usuario REAL en la base de datos para cada test que lo necesite
  // Este es el "activeUser" que será utilizado por los tests autenticados
  activeUser = await User.create({
    id: 1, // Puedes fijar el ID o dejar que Sequelize lo genere si no es importante
    name: 'Usuario Activo',
    id_number: '111111111',
    email: 'active.user@example.com',
    password: await bcrypt.hash('Password123!', 10), // Contraseña fuerte y hasheada
    phone: '3001234567',
    address: 'Calle Falsa 123',
    role: 'user',
    status: 'active',
  });

  // Genera el token para el usuario activo creado en la DB
  activeUserToken = jwt.sign(
    { id: activeUser.id, name: activeUser.name, email: activeUser.email, role: activeUser.role, status: activeUser.status },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  // Cierra la conexión de la base de datos después de todos los tests
  await sequelize.close();
});

// ======================= TESTS PARA GET /api/perfil =======================
describe('GET /api/perfil', () => {
  it('debe devolver el perfil del usuario autenticado', async () => {
    const response = await request(app)
      .get('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBe(activeUser.id);
    expect(response.body.user.email).toBe(activeUser.email);
    expect(response.body.user.password).toBeUndefined(); // La DB excluye la contraseña
  });

  it('debe devolver 401 si no se proporciona token', async () => {
    const response = await request(app)
      .get('/api/perfil');

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Token requerido');
  });

  it('debe devolver 403 si el token es inválido o expirado', async () => {
    const response = await request(app)
      .get('/api/perfil')
      .set('Authorization', `Bearer invalid_or_expired_token`);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Token inválido o expirado');
  });

  it('debe devolver 404 si el usuario del token no es encontrado en la DB', async () => {
    // Para este test, creamos un token para un usuario que NO existirá en la DB
    // después del beforeEach
    const nonExistentUserToken = jwt.sign(
      { id: 99999, email: 'nonexistent@example.com', role: 'user', status: 'active' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/perfil')
      .set('Authorization', `Bearer ${nonExistentUserToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Usuario no encontrado');
  });

  it('debe devolver 500 en caso de error interno del servidor', async () => {
    // Spy en findByPk para simular un error de DB
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .get('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al obtener perfil');
    expect(response.body.details).toBe('Database error'); // Verifica también los detalles

    // Restaura el método original
    User.findByPk = originalFindByPk;
  });
});

// ======================= TESTS PARA POST /api/cambiar-password =======================
describe('POST /api/cambiar-password', () => {
  // Ajustamos newStrongPassword para que cumpla con tu DTO (max 20 caracteres)
  const newStrongPassword = 'NewStrongPass123!'; // Longitud: 19
  const weakPassword = 'short';

  it('debe cambiar la contraseña del usuario autenticado correctamente', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Contraseña actualizada correctamente.');

    // Verifica que la contraseña en la DB ha cambiado y está hasheada correctamente
    const updatedUser = await User.findByPk(activeUser.id);
    expect(await bcrypt.compare(newStrongPassword, updatedUser.password)).toBe(true);
  });

  it('debe devolver 400 si la validación del DTO falla (ej. nueva contraseña débil)', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ newPassword: weakPassword, confirmNewPassword: weakPassword });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
    // Ajustado para coincidir con el mensaje de tu DTO
    expect(response.body.error).toContain('La contraseña debe tener al menos 6 caracteres');
  });

  it('debe devolver 401 si no se proporciona token', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Token requerido');
  });

  it('debe devolver 403 si el token es inválido o expirado', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer invalid_or_expired_token`)
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Token inválido o expirado');
  });

  it('debe devolver 404 si el usuario del token no es encontrado en la DB', async () => {
    // Crear un token para un usuario que no existe en la DB
    const nonExistentUserToken = jwt.sign(
      { id: 99999, email: 'nonexistent@example.com', role: 'user', status: 'active' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${nonExistentUserToken}`)
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword }); // Datos válidos para DTO

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Usuario no encontrado');
  });

  it('debe devolver 500 en caso de error interno del servidor', async () => {
    // Spy en findByPk para simular un error de DB
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ newPassword: newStrongPassword, confirmNewPassword: newStrongPassword }); // Datos válidos para DTO

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al cambiar la contraseña');
    expect(response.body.details).toBe('Database error');

    // Restaura el método original
    User.findByPk = originalFindByPk;
  });
});

// ======================= TESTS PARA PATCH /api/perfil =======================
describe('PATCH /api/perfil', () => {
  const updates = { name: 'Nuevo Nombre', phone: '9876543210' };
  const invalidUpdates = { email: 'invalid-email' };

  it('debe actualizar correctamente los campos del perfil del usuario', async () => {
    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send(updates);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe(updates.name);
    expect(response.body.user.phone).toBe(updates.phone);
    expect(response.body.user.password).toBeUndefined(); // Contraseña no debe ser expuesta
    expect(response.body.message).toBe('Perfil actualizado correctamente.'); // Verifica el mensaje de éxito

    // Verifica que los cambios se reflejen en la DB real
    const updatedUserInDb = await User.findByPk(activeUser.id);
    expect(updatedUserInDb.name).toBe(updates.name);
    expect(updatedUserInDb.phone).toBe(updates.phone);
    // Asegúrate de que otros campos no hayan cambiado si no fueron modificados
    expect(updatedUserInDb.email).toBe(activeUser.email);
  });

  it('debe devolver 400 si la validación del DTO falla', async () => {
    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send(invalidUpdates);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
    // Ajustado para coincidir con el mensaje de tu DTO
    expect(response.body.error).toContain('Debe ser un correo válido');
  });

  it('debe devolver 401 si no se proporciona token', async () => {
    const response = await request(app)
      .patch('/api/perfil')
      .send(updates);

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Token requerido');
  });

  it('debe devolver 403 si el token es inválido o expirado', async () => {
    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer invalid_or_expired_token`)
      .send(updates);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Token inválido o expirado');
  });

  it('debe devolver 404 si el usuario del token no es encontrado en la DB', async () => {
    const nonExistentUserToken = jwt.sign(
      { id: 99999, email: 'nonexistent@example.com', role: 'user', status: 'active' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${nonExistentUserToken}`)
      .send(updates); // Datos válidos para DTO

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Usuario no encontrado');
  });

  it('debe devolver 500 en caso de error interno del servidor', async () => {
    // Spy en findByPk para simular un error de DB
    const originalFindByPk = User.findByPk;
    User.findByPk = jest.fn(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send(updates); // Datos válidos para DTO

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al actualizar perfil');
    expect(response.body.details).toBe('Database error');

    // Restaura el método original
    User.findByPk = originalFindByPk;
  });
});