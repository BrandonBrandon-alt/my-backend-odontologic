const userService = require('../services/user-service');

const getProfile = async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.id);
        res.json({ user });
    } catch (err) {
        if (err.status === 404) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Error al obtener perfil', details: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const result = await userService.changePassword(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        if (err.status === 400 || err.status === 401 || err.status === 404) {
            return res.status(err.status).json({ error: err.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al cambiar la contraseña.', details: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const result = await userService.updateProfile(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        if (err.status === 400 || err.status === 404) {
            return res.status(err.status).json({ error: err.message });
        }
        res.status(500).json({ error: 'Error al actualizar perfil', details: err.message });
    }
};

module.exports = {
    getProfile,
    changePassword,
    updateProfile,
}; 