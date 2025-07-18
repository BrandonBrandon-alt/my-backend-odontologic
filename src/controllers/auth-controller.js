const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const { Op } = require("sequelize");
const util = require('util');

const createUserDTO = require('../dtos/registro-dto');
const loginDTO = require('../dtos/login-dto');
const resetPasswordDTO = require('../dtos/reset-password-dto');
const { User } = require('../models/index');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { sanitizeUser } = require('../utils/user-utils');
const authService = require('../services/auth-service');

let refreshTokens = [];

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
        console.log("Respuesta de Google reCAPTCHA:", response.data); // <-- Agrega esto
        return response.data;
    } catch (error) {
        console.error("Error al verificar reCAPTCHA:", error);
        return { success: false };
    }
}

const jwtVerifyAsync = util.promisify(jwt.verify);

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            message: "Usuario registrado exitosamente. Revisa tu correo para activar tu cuenta.",
            user
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const result = await authService.refreshToken(req.body.refreshToken);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const activateAccount = async (req, res, next) => {
    try {
        const result = await authService.activateAccount(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const resendActivationCode = async (req, res, next) => {
    try {
        const result = await authService.resendActivationCode(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const requestPasswordReset = async (req, res, next) => {
    try {
        const result = await authService.requestPasswordReset(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const resendPasswordReset = async (req, res, next) => {
    try {
        const result = await authService.resendPasswordReset(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const verifyResetCode = async (req, res, next) => {
    try {
        const result = await authService.verifyResetCode(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        const result = await authService.logout(req.body.refreshToken);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const getRefreshTokens = () => authService.getRefreshTokens();
const clearRefreshTokens = () => { authService.clearRefreshTokens(); };

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
    verifyRecaptcha: authService.verifyRecaptcha
}; 