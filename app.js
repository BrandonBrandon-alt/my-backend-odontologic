const express = require('express');
const registroRouter = require('./routers/auth'); 
const loginRouter = require('./routers/auth')// Cambia el nombre del archivo aquí
const perfilRouter = require('./routers/user'); // Asegúrate de que este archivo exista
const app = express();
app.use(express.json());
app.use('/', registroRouter,loginRouter, perfilRouter); // Asegúrate de que los routers estén correctamente configurados

module.exports = app;