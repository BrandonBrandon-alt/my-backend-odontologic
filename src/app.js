// filepath: app.js
const express = require('express');
const cors = require('cors');

// Inicializar modelos y conexión a la base de datos
require('./models/index');

const authRouter = require('./routers/auth-router');
const userRouter = require('./routers/user-router');
const app = express();

// Configuración de CORS
app.use(cors({
    // CAMBIAR A LA URL DONDE REALMENTE CORRE TU FRONTEND (Vite)
    origin: 'http://localhost:5173', // <--- ¡CAMBIADO A 5173!
    credentials: true // Si necesitas enviar cookies o cabeceras de autorización
}));

app.use(express.json()); // Middleware para parsear JSON en el cuerpo de las solicitudes
app.use('/api', authRouter); // Prefijo '/api' para tus rutas de autenticación
app.use('/api/user', userRouter); // Prefijo '/api/user' para tus rutas de usuario

module.exports = app;
