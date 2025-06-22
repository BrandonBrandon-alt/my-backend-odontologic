const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const { Op } = require("sequelize");

const createUserDTO = require('../dtos/registro-dto');
const loginDTO = require('../dtos/login-dto');
const resetPasswordDTO = require('../dtos/reset-password-dto');
const { User } = require('../models/index');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/mailer');

let refreshTokens = [];

function generateCodeWithExpiration(bytes = 2, expiresInMinutes = 60) {
    const code = crypto.randomBytes(bytes).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    return { code, expiresAt };
}

async function verifyRecaptcha(token) {
    const secret = process.env.RECAPTCHA_SECRET_KEY ;
    const url = "https://www.google.com/recaptcha/api/siteverify";
    try {
        const response = await axios.post(
            url,
            null,
            {
                params: {
                    secret: secret,
                    response: token,
                },
            }
        );
        console.log("Respuesta de Google reCAPTCHA:", response.data); // <-- Agrega esto
        return response.data;
    } catch (error) {
        console.error("Error al verificar reCAPTCHA:", error);
        return { success: false };
    }
}
const register = async (req, res) => {
    try {

        const { captchaToken } = req.body;
        const recaptchaResult = await verifyRecaptcha(captchaToken);
        if (!recaptchaResult) {
            return res.status(400).json({ error: "Verificación de reCAPTCHA fallida. Intenta de nuevo." });
        }
        console.log("Respuesta de Google reCAPTCHA:", recaptchaResult);

        const { error } = createUserDTO.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, idNumber, email, password, phone, address, birth_date } = req.body;

        const exists = await User.findOne({
            where: {
                [Op.or]: [{ id_number: idNumber }, { email }],
            },
        });
        if (exists) {
            return res.status(400).json({
                error: "El usuario ya existe con ese email o número de identificación",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { code: activationCode, expiresAt: activationExpiresAt } = generateCodeWithExpiration(8, 1440); // 24 hours

        const userToCreate = {
            name,
            id_number: idNumber,
            email,
            password: hashedPassword,
            phone,
            address: address || null,
            birth_date: birth_date ? new Date(birth_date) : null,
            role: "user",
            status: "inactive",
            activation_code: activationCode,
            activation_expires_at: activationExpiresAt,
        };

        const user = await User.create(userToCreate);
        await sendActivationEmail(email, activationCode);

        res.status(201).json({
            message: "Usuario registrado exitosamente. Revisa tu correo para activar tu cuenta.",
            user: { ...user.toJSON(), password: undefined },
        });

    } catch (err) {
        console.error("Error al registrar usuario:", err);
        res.status(500).json({ error: "Error al registrar usuario", details: err.message });
    }
};

const login = async (req, res) => {
    const { error } = loginDTO.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;

    try {

        const { captchaToken } = req.body;
        const recaptchaResult = await verifyRecaptcha(captchaToken);
        if (!recaptchaResult) {
            return res.status(400).json({ error: "Verificación de reCAPTCHA fallida. Intenta de nuevo." });
        }
        console.log("Respuesta de Google reCAPTCHA:", recaptchaResult);

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Usuario no encontrado" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        if (user.status !== "active") {
            return res.status(403).json({ error: "Cuenta inactiva o bloqueada. Por favor, activa tu cuenta." });
        }

        const accessToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );
        refreshTokens.push(refreshToken);

        res.status(200).json({
            message: "Inicio de sesión exitoso",
            token: accessToken,
            refreshToken: refreshToken,
            user: { ...user.toJSON(), password: undefined },
        });
    } catch (err) {
        res.status(500).json({ error: "Error en el login", details: err.message });
    }
};

const refreshToken = (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ error: "Refresh token requerido" });
    if (!refreshTokens.includes(refreshToken))
        return res.status(401).json({ error: "Refresh token inválido" });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Refresh token inválido" });

        const accessToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({ token: accessToken });
    });
};

const activateAccount = async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ where: { email, activation_code: code } });
        if (!user) {
            return res.status(400).json({ error: "Código o correo incorrecto" });
        }

        if (user.activation_expires_at && new Date() > user.activation_expires_at) {
            return res.status(400).json({ error: "El código de activación ha expirado. Por favor, solicita uno nuevo." });
        }

        user.status = "active";
        user.activation_code = null;
        user.activation_expires_at = null;
        await user.save();
        res.json({ message: "Cuenta activada correctamente" });
    } catch (err) {
        console.error('Error al activar cuenta:', err);
        res.status(500).json({ error: "Error al activar cuenta", details: err.message });
    }
};

const resendActivationCode = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "El correo es obligatorio" });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        if (user.status === "active") {
            return res.status(400).json({ error: "La cuenta ya está activada" });
        }

        const { code: newActivationCode, expiresAt: newActivationExpiresAt } = generateCodeWithExpiration(8, 1440);

        user.activation_code = newActivationCode;
        user.activation_expires_at = newActivationExpiresAt;
        await user.save();

        await sendActivationEmail(email, newActivationCode);

        res.json({ message: "Código de activación reenviado correctamente. Revisa tu correo." });
    } catch (err) {
        res.status(500).json({ error: "Error al reenviar código", details: err.message });
    }
};

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "El correo es obligatorio" });
    }
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const { code: resetCode, expiresAt: resetExpiresAt } = generateCodeWithExpiration(8, 30);

        user.password_reset_code = resetCode;
        user.password_reset_expires_at = resetExpiresAt;
        await user.save();

        await sendPasswordResetEmail(email, resetCode);

        res.json({ message: "Código de recuperación enviado correctamente. Revisa tu correo." });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error al solicitar recuperación", details: err.message });
    }
};

const resendPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "El correo es obligatorio" });
    }
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const { code: newResetCode, expiresAt: newResetExpiresAt } = generateCodeWithExpiration(8, 30);

        user.password_reset_code = newResetCode;
        user.password_reset_expires_at = newResetExpiresAt;
        await user.save();

        await sendPasswordResetEmail(email, newResetCode);
        res.json({ message: "Código de recuperación reenviado correctamente. Revisa tu correo." });
    } catch (err) {
        res.status(500).json({ error: "Error al reenviar código de recuperación", details: err.message });
    }
};

const resetPassword = async (req, res) => {
    const { error } = resetPasswordDTO.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { password_reset_code, newPassword } = req.body;

    try {
        const user = await User.findOne({ where: { password_reset_code } });
        if (!user) {
            return res.status(400).json({ error: "Código de recuperación inválido o ya utilizado" });
        }

        if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
            return res.status(400).json({ error: "El código de recuperación ha expirado. Por favor, solicita uno nuevo." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.password_reset_code = null;
        user.password_reset_expires_at = null;
        await user.save();

        res.json({ message: "Contraseña actualizada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al cambiar contraseña", details: err.message });
    }
};

const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: "El correo y el código son obligatorios" });
    }

    try {
        const user = await User.findOne({ where: { email, password_reset_code: code } });
        if (!user) {
            return res.status(400).json({ error: "Código o correo incorrecto" });
        }
        if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
            return res.status(400).json({ error: "El código de recuperación ha expirado. Por favor, solicita uno nuevo." });
        }

        res.json({ message: "Código válido" });
    } catch (err) {
        res.status(500).json({ error: "Error al verificar el código", details: err.message });
    }
};

const logout = (req, res) => {
    const { refreshToken } = req.body;
    const index = refreshTokens.indexOf(refreshToken);
    if (index > -1) {
        refreshTokens.splice(index, 1);
    }
    res.json({ success: true, message: "Logout exitoso" });
};

const getRefreshTokens = () => refreshTokens;
const clearRefreshTokens = () => { refreshTokens.length = 0; };

module.exports = {
    registro: register,
    activar: activateAccount,
    login,
    refreshToken: refreshToken,
    logout,
    resendActivationCode,
    requestPasswordReset,
    resendPasswordReset,
    resetPassword,
    verifyResetCode,
    getRefreshTokens,
    clearRefreshTokens,
}; 