const request = require('supertest');
const { User, sequelize } = require('../../models/user');
const express = require('express');
const userRouter = require('../../routers/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use('/user', userRouter);

let token, user;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  user = await User.create({
    name: 'Test User',
    id_number: '123456789',
    email: 'testuser@example.com',
    password: await bcrypt.hash('oldpassword', 10),
    phone: '1234567890',
    role: 'user',
    status: 'active',
  });
  token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await sequelize.close();
});

describe('User endpoints', () => {

  // ======================= PERFIL DE USUARIO =======================
  it('debe mostrar el perfil', async () => {
    const res = await request(app)
      .get('/user/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('testuser@example.com');
  });

  it('debe fallar si no está autenticado al ver perfil', async () => {
    const res = await request(app)
      .get('/user/perfil');
    expect(res.statusCode).toBe(401);
  });

  // ======================= CAMBIO DE CONTRASEÑA =======================
  it('debe cambiar la contraseña correctamente', async () => {
    const res = await request(app)
      .post('/user/cambiar-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newPassword: 'nuevaPassword123',
        confirmNewPassword: 'nuevaPassword123',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Contraseña actualizada correctamente.');

    // Verifica que la contraseña realmente cambió
    const updatedUser = await User.findByPk(user.id);
    const isMatch = await bcrypt.compare('nuevaPassword123', updatedUser.password);
    expect(isMatch).toBe(true);
  });

  it('debe fallar si las contraseñas no coinciden', async () => {
    const res = await request(app)
      .post('/user/cambiar-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        newPassword: 'nuevaPassword123',
        confirmNewPassword: 'otraPassword',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Las contraseñas no coinciden');
  });

  it('debe fallar si no está autenticado al cambiar contraseña', async () => {
    const res = await request(app)
      .post('/user/cambiar-password')
      .send({
        newPassword: 'nuevaPassword123',
        confirmNewPassword: 'nuevaPassword123',
      });
    expect(res.statusCode).toBe(401);
  });

});