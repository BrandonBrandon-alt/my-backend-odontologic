const express = require('express');
const authRouter = require('./routers/auth');
const userRouter = require('./routers/user');
const app = express();

app.use(express.json());
app.use('/', authRouter); // rutas de auth (registro, login, activar, etc)
app.use('/user', userRouter); // rutas de usuario (perfil, cambiar-password, etc)

module.exports = app;
