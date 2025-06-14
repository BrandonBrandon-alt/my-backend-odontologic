const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { User } = require('../models/user');
const resetPassword = require('../dto/ChangedPasswordDTO'); 
const updateProfile = require('../dto/updateProfileDTO');// DTO para cambio de contraseña
const bcrypt = require('bcrypt');

// ======================= OBTENER PERFIL DE USUARIO =======================
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

// ======================= CAMBIO DE CONTRASEÑA (AUTENTICADO) =======================
router.post('/cambiar-password', authenticateToken, async (req, res) => {
  const { error } = resetPassword.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { newPassword } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar la contraseña', details: err.message });
  }
});


// ======================= ACTUALIZAR PERFIL(AUTENTICADO) =======================
router.patch('/perfil', authenticateToken, async (req, res) => {
  const { error } = updateProfile.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.phone !== undefined) user.phone = req.body.phone;

    await user.save();
    res.json({ user: { ...user.toJSON(), password: undefined } });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil', details: err.message });
  }
});

module.exports = router;