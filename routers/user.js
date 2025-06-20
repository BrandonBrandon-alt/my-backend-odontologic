const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { User } = require('../models/user');
const resetPassword = require('../dto/ChangedPasswordDTO'); 
const updateProfileJoiSchema = require('../dto/updateProfileDTO');// DTO para cambio de contraseña
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
  // 1. Validar la entrada con el esquema Joi (ahora modificado)
  const { error } = resetPassword.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // 2. Extraer ambas contraseñas del cuerpo de la solicitud
  const { currentPassword, newPassword } = req.body;

  try {
    // 3. Encontrar al usuario por su ID (obtenido del token de autenticación)
    const user = await User.findByPk(req.user.id);
    if (!user) {
      // Esto es una capa de seguridad extra, rara vez debería ser 404 si el token es válido
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 4. **Paso CRÍTICO**: Comparar la contraseña actual proporcionada con la almacenada en la DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      // Si la contraseña actual no coincide, envía un error
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // 5. Opcional pero recomendado: Asegurarse de que la nueva contraseña no sea la misma que la actual
    // Esto previene que un usuario "cambie" su contraseña a la misma que ya tiene.
    const isNewSameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (isNewSameAsCurrent) {
        return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual.' });
    }

    // 6. Hashear la nueva contraseña y guardarla en la base de datos
    // El '10' es el factor de costo (rondas de sal) para bcrypt. Asegúrate de que sea consistente.
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Error al cambiar la contraseña en el backend:', err);
    res.status(500).json({ error: 'Error interno del servidor al cambiar la contraseña.', details: err.message });
  }
});


// ======================= ACTUALIZAR PERFIL(AUTENTICADO) =======================
router.patch('/perfil', authenticateToken, async (req, res) => {
  // Ahora usas 'updateProfileJoiSchema' que es tu esquema Joi
  const { error, value: validatedData } = updateProfileJoiSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.update(validatedData);

    const userWithoutPassword = { ...user.toJSON() };
    delete userWithoutPassword.password;

    res.json({
      user: userWithoutPassword,
      message: 'Perfil actualizado correctamente.'
    });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil', details: err.message });
  }
});



module.exports = router;