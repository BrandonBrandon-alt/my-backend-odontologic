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

app.get('/health', (req, res) => {
    try {
        // Verificar conexión a la base de datos
        // Verificar otros servicios críticos
        res.json({ 
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Error en el servidor'
        });
    }
});

module.exports = app;
