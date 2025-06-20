// tests/user/user.test.js

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userRoutes = require('../../routers/user');
const { User, sequelize } = require('../../models/user');

const app = express();
app.use(express.json());
app.use('/api', userRoutes);

let activeUser;
let activeUserToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await User.destroy({ truncate: true, cascade: true });
  await sequelize.sync({ force: true });

  activeUser = await User.create({
    id: 1,
    name: 'Usuario Activo',
    id_number: '111111111',
    email: 'active.user@example.com',
    password: await bcrypt.hash('Password123!', 10),
    phone: '3001234567',
    address: 'Calle Falsa 123',
    role: 'user',
    status: 'active',
  });

  activeUserToken = jwt.sign(
    { id: activeUser.id, name: activeUser.name, email: activeUser.email, role: activeUser.role, status: activeUser.status },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterEach(() => {
  // Restaura todos los mocks después de cada prueba
  jest.restoreAllMocks();
});

afterAll(async () => {
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
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('debe devolver 401 si no se proporciona token', async () => {
    const response = await request(app).get('/api/perfil');
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
    jest.spyOn(User, 'findByPk').mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .get('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al obtener perfil');
    expect(response.body.details).toBe('Database error');
  });
});

// ======================= TESTS PARA POST /api/cambiar-password =======================
describe('POST /api/cambiar-password', () => {
  const currentPassword = 'Password123!';
  const newStrongPassword = 'NewStrongPass123!';
  const weakPassword = 'short';

  it('debe cambiar la contraseña del usuario autenticado correctamente', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ currentPassword, newPassword: newStrongPassword });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Contraseña actualizada correctamente.');

    const updatedUser = await User.findByPk(activeUser.id);
    expect(await bcrypt.compare(newStrongPassword, updatedUser.password)).toBe(true);
  });

  it('debe devolver 401 si la contraseña actual es incorrecta', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ currentPassword: 'wrong-password', newPassword: newStrongPassword });
    
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('La contraseña actual es incorrecta.');
  });
  
  it('debe devolver 400 si la nueva contraseña es igual a la actual', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ currentPassword, newPassword: currentPassword });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('La nueva contraseña no puede ser igual a la actual.');
  });

  it('debe devolver 400 si la validación del DTO falla (ej. nueva contraseña débil)', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ currentPassword, newPassword: weakPassword });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('La nueva contraseña debe tener al menos 6 caracteres');
  });

  it('debe devolver 401 si no se proporciona token', async () => {
    const response = await request(app)
      .post('/api/cambiar-password')
      .send({ currentPassword, newPassword: newStrongPassword });

    expect(response.statusCode).toBe(401);
  });

  it('debe devolver 404 si el usuario del token no es encontrado en la DB', async () => {
    const nonExistentUserToken = jwt.sign({ id: 99999 }, process.env.JWT_SECRET);

    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${nonExistentUserToken}`)
      .send({ currentPassword, newPassword: newStrongPassword });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Usuario no encontrado.');
  });

  it('debe devolver 500 en caso de error interno del servidor', async () => {
    jest.spyOn(User, 'findByPk').mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .post('/api/cambiar-password')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ currentPassword, newPassword: newStrongPassword });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error interno del servidor al cambiar la contraseña.');
    expect(response.body.details).toBe('Database error');
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
    expect(response.body.message).toBe('Perfil actualizado correctamente.');

    const updatedUserInDb = await User.findByPk(activeUser.id);
    expect(updatedUserInDb.name).toBe(updates.name);
    expect(updatedUserInDb.phone).toBe(updates.phone);
  });

  it('debe devolver 400 si la validación del DTO falla', async () => {
    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send(invalidUpdates);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain('Debe ser un correo válido');
  });
  
  it('debe devolver 500 en caso de error interno del servidor', async () => {
    jest.spyOn(User, 'findByPk').mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .patch('/api/perfil')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send(updates);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Error al actualizar perfil');
    expect(response.body.details).toBe('Database error');
  });
});