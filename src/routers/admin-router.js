const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');


// ======================= RUTAS DE ADMINISTRADOR =======================
// routers/admin-router.js
router.get('/dentists', adminController.listDentists);
router.get('/dentist/:id', adminController.getDentist);
router.get('/users', adminController.getAllUsers);

module.exports = router;