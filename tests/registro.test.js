const request = require('supertest');
const { User, sequelize } = require('../models/user');
const express = require('express');
const registroRoutes = require('../routers/auth'); // Ajusta la ruta si es necesario

const app = express();
app.use(express.json());
app.use('/', registroRoutes);

beforeAll(async () => {
  await sequelize.sync({ force: true }); // Limpia la base de datos para pruebas
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /registro', () => {
  it('debe registrar correctamente un usuario válido', async () => {
    const response = await request(app).post('/registro').send({
      name: 'Carlos',
      idNumber: '12345678',
      email: 'carlos@example.com',
      password: 'secreto123',
      phone: '1234567890'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Usuario registrado exitosamente');
    expect(response.body.user).toMatchObject({
      name: 'Carlos',
      id_number: '12345678',
      email: 'carlos@example.com',
      phone: '1234567890'
    });
    expect(response.body.user.password).toBeUndefined();
  });

  it('debe fallar si falta el campo name', async () => {
    const response = await request(app).post('/registro').send({
      idNumber: '12345678',
      email: 'carlos@example.com',
      password: 'secreto123',
      phone: '1234567890'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('El nombre es obligatorio');
  });

  it('debe fallar si el email no es válido', async () => {
    const response = await request(app).post('/registro').send({
      name: 'Carlos',
      idNumber: '12345678',
      email: 'correo-no-valido',
      password: 'secreto123',
      phone: '1234567890'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Debe ser un correo válido');
  });

  it('debe fallar si el teléfono no tiene 10 dígitos', async () => {
    const response = await request(app).post('/registro').send({
      name: 'Carlos',
      idNumber: '12345678',
      email: 'carlos@example.com',
      password: 'secreto123',
      phone: '1234'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('El teléfono debe tener 10 dígitos');
  });

  it('debe fallar si el número de identificación no tiene entre 8 y 10 dígitos', async () => {
    const response = await request(app).post('/registro').send({
      name: 'Carlos',
      idNumber: '123',
      email: 'carlos@example.com',
      password: 'secreto123',
      phone: '1234567890'
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('El número de identificación debe tener entre 8 y 10 dígitos');
  });
});