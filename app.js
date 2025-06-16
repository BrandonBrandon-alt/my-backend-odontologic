const express = require('express');
const cors = require('cors');
const authRouter = require('./routers/auth');
const userRouter = require('./routers/user');
const app = express();

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:3001', // URL de tu frontend
    credentials: true // Si necesitas enviar cookies
}));

app.use(express.json());
app.use('/', authRouter);
app.use('/user', userRouter);


module.exports = app;
