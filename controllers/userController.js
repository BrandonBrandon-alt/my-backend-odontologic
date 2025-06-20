const { User } = require('../models/user');
const resetPassword = require('../dto/ChangedPasswordDTO'); 
const updateProfileJoiSchema = require('../dto/updateProfileDTO');
const bcrypt = require('bcrypt');

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener perfil', details: err.message });
    }
};

const changePassword = async (req, res) => {
    const { error } = resetPassword.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
        }

        const isNewSameAsCurrent = await bcrypt.compare(newPassword, user.password);
        if (isNewSameAsCurrent) {
            return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        console.error('Error al cambiar la contraseña en el backend:', err);
        res.status(500).json({ error: 'Error interno del servidor al cambiar la contraseña.', details: err.message });
    }
};

const updateProfile = async (req, res) => {
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
};

module.exports = {
    getProfile,
    changePassword,
    updateProfile,
}; 