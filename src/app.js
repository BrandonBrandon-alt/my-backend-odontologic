// filepath: app.js
const express = require('express');
const cors = require('cors');

// Inicializar modelos y conexión a la base de datos
require('./models/index');

const authRouter = require('./routers/auth-router');
const userRouter = require('./routers/user-router');
const guestPatientRouter = require('./routers/guest-patient-router');
const appointmentRouter = require('./routers/appointment-router');
const specialtyRouter = require('./routers/especialidad-router');
const serviceTypeRouter = require('./routers/service-type-router');
const availabilityRouter = require('./routers/disponibilidad-router');
const contactRouter = require('./routers/contact-router');
const adminRouter = require('./routers/admin-router');
const errorHandler = require('./middleware/error-handler');
const app = express();

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Public routes
app.use('/api/specialty', specialtyRouter); // GET /api/specialty
app.use('/api/service-type', serviceTypeRouter); // GET /api/service-type
app.use('/api/availability', availabilityRouter); // GET /api/availability
app.use('/api/guest-patient', guestPatientRouter); // POST /api/guest-patient

// Appointment routes
app.use('/api/appointment', appointmentRouter); // /api/appointment/my, /api/appointment/guest, etc.

// Contact
app.use('/api/contact', contactRouter); // POST /api/contact/send-message

// Auth & user
app.use('/api/auth', authRouter); // /api/auth/login, /api/auth/register, etc.
app.use('/api/user', userRouter);

// Admin
app.use('/api/admin', adminRouter);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
