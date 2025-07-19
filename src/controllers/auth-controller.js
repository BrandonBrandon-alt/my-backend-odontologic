const authService = require('../services/auth-service');

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            message: "User registered successfully. Check your email to activate your account.",
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

const refreshToken = async (req, res, next) => {
    try {
        const result = await authService.refreshToken(req.body.refreshToken);
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

module.exports = {
    register,
    activate: activateAccount,
    login,
    refreshToken,
    logout,
    resendActivationCode,
    requestPasswordReset,
    resendPasswordReset,
    resetPassword,
    verifyResetCode,
}; 