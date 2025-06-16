// filepath: app.js
const express = require('express');
const cors = require('cors');
const authRouter = require('./routers/auth');
const userRouter = require('./routers/user');
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

// index.js (Este archivo está bien)
// const app = require('./app');

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Servidor escuchando en http://localhost:${PORT}`);
// });
