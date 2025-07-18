const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const { Op } = require("sequelize");
const createUserDTO = require('../dtos/registro-dto');
const loginDTO = require('../dtos/login-dto');
const resetPasswordDTO = require('../dtos/reset-password-dto');
const { User, RefreshToken } = require('../models/index');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { sanitizeUser } = require('../utils/user-utils');
const util = require('util');
const jwtVerifyAsync = util.promisify(jwt.verify);

function generateCodeWithExpiration(bytes = 2, expiresInMinutes = 60) {
    const code = crypto.randomBytes(bytes).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    return { code, expiresAt };
}

async function verifyRecaptcha(token) {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
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
        console.log("Respuesta de Google reCAPTCHA:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al verificar reCAPTCHA:", error);
        return { success: false };
    }
}

async function register(data) {
    const { error } = createUserDTO.validate(data, { allowUnknown: true });
    if (error) {
        const err = new Error(error.details[0].message);
        err.status = 400;
        throw err;
    }
    const { name, idNumber, email, password, phone, address, birth_date } = data;
    const exists = await User.findOne({
        where: {
            [Op.or]: [{ id_number: idNumber }, { email }],
        },
    });
    if (exists) {
        const err = new Error("El usuario ya existe con ese email o número de identificación");
        err.status = 400;
        throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const { code: activationCode, expiresAt: activationExpiresAt } = generateCodeWithExpiration(8, 1440);
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
    return sanitizeUser(user);
}

async function login(data) {
    const { error } = loginDTO.validate(data);
    if (error) {
        const err = new Error(error.details[0].message);
        err.status = 400;
        throw err;
    }
    const { email, password } = data;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        const err = new Error("Credenciales inválidas");
        err.status = 400;
        throw err;
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        const err = new Error("Credenciales inválidas");
        err.status = 400;
        throw err;
    }
    if (user.status !== "active") {
        const err = new Error("Cuenta inactiva o bloqueada. Por favor, activa tu cuenta.");
        err.status = 403;
        throw err;
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
    // Guardar refresh token en la base de datos
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    await RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt
    });
    return {
        message: "Inicio de sesión exitoso",
        token: accessToken,
        refreshToken: refreshToken,
        user: sanitizeUser(user),
    };
}

async function refreshTokenFn(token) {
    if (!token) {
        const err = new Error("Refresh token requerido");
        err.status = 401;
        throw err;
    }
    // Buscar el refresh token en la base de datos
    const dbToken = await RefreshToken.findOne({ where: { token } });
    if (!dbToken) {
        const err = new Error("Refresh token inválido");
        err.status = 401;
        throw err;
    }
    if (dbToken.expires_at && new Date() > dbToken.expires_at) {
        await dbToken.destroy();
        const err = new Error("Refresh token expirado");
        err.status = 403;
        throw err;
    }
    try {
        const user = await jwtVerifyAsync(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        return { token: accessToken };
    } catch (err) {
        await dbToken.destroy();
        const error = new Error("Refresh token inválido");
        error.status = 403;
        throw error;
    }
}

async function activateAccount(data) {
    const { email, code } = data;
    const user = await User.findOne({ where: { email, activation_code: code } });
    if (!user) {
        const err = new Error("Código o correo incorrecto");
        err.status = 400;
        throw err;
    }
    if (user.activation_expires_at && new Date() > user.activation_expires_at) {
        const err = new Error("El código de activación ha expirado. Por favor, solicita uno nuevo.");
        err.status = 400;
        throw err;
    }
    user.status = "active";
    user.activation_code = null;
    user.activation_expires_at = null;
    await user.save();
    return { message: "Cuenta activada correctamente" };
}

async function resendActivationCode(data) {
    const { email } = data;
    if (!email) {
        const err = new Error("El correo es obligatorio");
        err.status = 400;
        throw err;
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    if (user.status === "active") {
        const err = new Error("La cuenta ya está activada");
        err.status = 400;
        throw err;
    }
    const { code: newActivationCode, expiresAt: newActivationExpiresAt } = generateCodeWithExpiration(8, 1440);
    user.activation_code = newActivationCode;
    user.activation_expires_at = newActivationExpiresAt;
    await user.save();
    await sendActivationEmail(email, newActivationCode);
    return { message: "Código de activación reenviado correctamente. Revisa tu correo." };
}

async function requestPasswordReset(data) {
    const { email } = data;
    if (!email) {
        const err = new Error("El correo es obligatorio");
        err.status = 400;
        throw err;
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    const { code: resetCode, expiresAt: resetExpiresAt } = generateCodeWithExpiration(8, 30);
    user.password_reset_code = resetCode;
    user.password_reset_expires_at = resetExpiresAt;
    await user.save();
    await sendPasswordResetEmail(email, resetCode);
    return { message: "Código de recuperación enviado correctamente. Revisa tu correo." };
}

async function resendPasswordReset(data) {
    const { email } = data;
    if (!email) {
        const err = new Error("El correo es obligatorio");
        err.status = 400;
        throw err;
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    const { code: newResetCode, expiresAt: newResetExpiresAt } = generateCodeWithExpiration(8, 30);
    user.password_reset_code = newResetCode;
    user.password_reset_expires_at = newResetExpiresAt;
    await user.save();
    await sendPasswordResetEmail(email, newResetCode);
    return { message: "Código de recuperación reenviado correctamente. Revisa tu correo." };
}

async function resetPassword(data) {
    const { error } = resetPasswordDTO.validate(data);
    if (error) {
        const err = new Error(error.details[0].message);
        err.status = 400;
        throw err;
    }
    const { password_reset_code, newPassword } = data;
    const user = await User.findOne({ where: { password_reset_code } });
    if (!user) {
        const err = new Error("Código de recuperación inválido o ya utilizado");
        err.status = 400;
        throw err;
    }
    if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
        const err = new Error("El código de recuperación ha expirado. Por favor, solicita uno nuevo.");
        err.status = 400;
        throw err;
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.password_reset_code = null;
    user.password_reset_expires_at = null;
    await user.save();
    return { message: "Contraseña actualizada correctamente" };
}

async function verifyResetCode(data) {
    const { email, code } = data;
    if (!email || !code) {
        const err = new Error("El correo y el código son obligatorios");
        err.status = 400;
        throw err;
    }
    const user = await User.findOne({ where: { email, password_reset_code: code } });
    if (!user) {
        const err = new Error("Código o correo incorrecto");
        err.status = 400;
        throw err;
    }
    if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
        const err = new Error("El código de recuperación ha expirado. Por favor, solicita uno nuevo.");
        err.status = 400;
        throw err;
    }
    return { message: "Código válido" };
}

function logout(token) {
    // Eliminar el refresh token de la base de datos
    return RefreshToken.destroy({ where: { token } }).then(() => ({ success: true, message: "Logout exitoso" }));
}

function getRefreshTokens() { return RefreshToken.findAll(); }
function clearRefreshTokens() { return RefreshToken.destroy({ where: {} }); }

module.exports = {
    register,
    login,
    refreshToken: refreshTokenFn,
    activateAccount,
    resendActivationCode,
    requestPasswordReset,
    resendPasswordReset,
    resetPassword,
    verifyResetCode,
    verifyRecaptcha,
    logout,
    getRefreshTokens,
    clearRefreshTokens
}; 