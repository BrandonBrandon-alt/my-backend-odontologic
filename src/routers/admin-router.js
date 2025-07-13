const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');


// ======================= RUTAS DE ADMINISTRADOR =======================
// routers/admin-router.js
router.get('/dentists', adminController.listDentists);

module.exports = router;