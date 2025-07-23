const authService = require("../services/auth.service");

// A helper to wrap async functions for cleaner error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const register = asyncHandler(async (req, res, next) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    message:
      "User registered successfully. Please check your email to activate your account.",
    user,
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  // For enhanced security, consider setting tokens in HttpOnly cookies
  // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(200).json({
    message: "Login successful.",
    accessToken,
    refreshToken, // Sending in body for client-side storage
    user,
  });
});

const activateAccount = asyncHandler(async (req, res, next) => {
  await authService.activateAccount(req.body);
  res.status(200).json({ message: "Account activated successfully." });
});

const resendActivationCode = asyncHandler(async (req, res, next) => {
  await authService.resendActivationCode(req.body);
  res
    .status(200)
    .json({
      message: "Activation code has been resent. Please check your email.",
    });
});

const requestPasswordReset = asyncHandler(async (req, res, next) => {
  await authService.requestPasswordReset(req.body);
  res
    .status(200)
    .json({
      message: "Password reset instructions have been sent to your email.",
    });
});

const resetPassword = asyncHandler(async (req, res, next) => {
  await authService.resetPassword(req.body);
  res.status(200).json({ message: "Password has been reset successfully." });
});

const verifyResetCode = asyncHandler(async (req, res, next) => {
  await authService.verifyResetCode(req.body);
  res.status(200).json({ message: "Reset code is valid." });
});

const refreshToken = asyncHandler(async (req, res, next) => {
  // The service expects an object like { token: '...' }
  const { accessToken } = await authService.refreshToken({
    token: req.body.refreshToken,
  });
  res.status(200).json({ accessToken });
});

const logout = asyncHandler(async (req, res, next) => {
  // The service expects an object like { token: '...' }
  await authService.logout({ token: req.body.refreshToken });
  res.status(204).send(); // 204 No Content is appropriate for a successful logout
});

module.exports = {
  register,
  activateAccount,
  login,
  refreshToken,
  logout,
  resendActivationCode,
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
};
