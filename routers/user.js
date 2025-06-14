const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { User } = require('../models/user');

router.get('/perfil', authenticateToken, async (req, res) => {
  try {
    // Busca el usuario en la base de datos usando el id del token
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // No mostrar la contraseña
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil', details: err.message });
  }
});

module.exports = router;