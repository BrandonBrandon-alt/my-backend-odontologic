// filepath: app.js
const express = require("express");
const cors = require("cors");

// Inicializar modelos y conexión a la base de datos
require("./models/index");

const authRouter = require("./routers/auth.router");
const userRouter = require("./routers/user.router");
const appointmentRouter = require("./routers/appointment.router");
const specialtyRouter = require("./routers/specialty.router");
const serviceTypeRouter = require("./routers/service-type.router");
const availabilityRouter = require("./routers/availability.router");
const contactRouter = require("./routers/contact.router");
const errorHandler = require("./middleware/error.handler");
const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Public routes
app.use("/api/specialty", specialtyRouter); // GET /api/specialty
app.use("/api/service-type", serviceTypeRouter); // GET /api/service-type
app.use("/api/availability", availabilityRouter); // GET /api/availability

// Appointment routes
app.use("/api/appointment", appointmentRouter); // /api/appointment/my, /api/appointment/guest, etc.

// Contact
app.use("/api/contact", contactRouter); // POST /api/contact/send-message

// Auth & user
app.use("/api/auth", authRouter); // /api/auth/login, /api/auth/register, etc.
app.use("/api/user", userRouter);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
