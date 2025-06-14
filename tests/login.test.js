const request = require('supertest');
const bcrypt = require('bcrypt');
const { User, sequelize } = require('../models/user');
const express = require('express');
const loginRoutes = require('../routers/auth'); // Ajusta la ruta si es necesario

const app = express();
app.use(express.json());
app.use('/', loginRoutes);

beforeAll(async () => {
  await sequelize.sync({ force: true }); // Limpia la base de datos para pruebas

  // Crea un usuario de prueba con contraseña encriptada
  const hashedPassword = await bcrypt.hash('clave123', 10);
  await User.create({
    name: 'Test User',
    id_number: '12345678',
    email: 'test@mail.com',
    password: hashedPassword,
    phone: '1234567890',
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /login', () => {
  it('debe responder con error si falta el email', async () => {
    const res = await request(app)
      .post('/login')
      .send({ password: 'clave123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('El correo es obligatorio');
  });

  it('debe responder con error si el email es inválido', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'noesunemail', password: 'clave123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Debe ser un correo válido');
  });

  it('debe responder con error si la contraseña es muy corta', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'test@mail.com', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('La contraseña debe tener al menos 6 caracteres');
  });

  it('debe responder con error si el usuario no existe', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'noexiste@mail.com', password: 'clave123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Usuario no encontrado');
  });

  it('debe responder con error si la contraseña es incorrecta', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'test@mail.com', password: 'claveIncorrecta' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Contraseña incorrecta');
  });

  it('debe responder con éxito si los datos son válidos', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'test@mail.com', password: 'clave123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Inicio de sesión exitoso');
    expect(res.body.user.email).toBe('test@mail.com');
    expect(res.body.user.password).toBeUndefined();
  });
});