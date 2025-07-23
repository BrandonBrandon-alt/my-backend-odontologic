const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, RefreshToken } = require("../models");
const {
  sendActivationEmail,
  sendPasswordResetEmail,
} = require("../utils/mailer");
const { sanitizeUser } = require("../utils/user-utils");

// DTO Imports
const registerDto = require("../dtos/auth/register.dto");
const loginDto = require("../dtos/auth/login.dto");
const resetPasswordDto = require("../dtos/auth/reset-password.dto");
const emailDto = require("../dtos/auth/email.dto");
const verifyCodeDto = require("../dtos/auth/verify-code.dto");
const tokenDto = require("../dtos/auth/token.dto");

/**
 * Creates a standard error object with a status code.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Generates a random code and its expiration date.
 */
function generateCodeWithExpiration(length = 8, expiresInMinutes = 60) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  return { code, expiresAt };
}

/**
 * Registers a new user.
 */
async function register(data) {
  const { error, value } = registerDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { name, idNumber, email, password, phone, address, birth_date } = value;

  const existingUser = await User.findOne({
    where: { [Op.or]: [{ id_number: idNumber }, { email }] },
  });
  if (existingUser) {
    throw createHttpError(
      409,
      "User already exists with this email or ID number."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { code, expiresAt } = generateCodeWithExpiration(8, 1440); // 24 hours

  const user = await User.create({
    name,
    id_number: idNumber,
    email,
    password: hashedPassword,
    phone,
    address,
    birth_date,
    role: "user",
    status: "inactive",
    activation_code: code,
    activation_expires_at: expiresAt,
  });

  await sendActivationEmail(email, code);
  return sanitizeUser(user);
}

/**
 * Logs a user in and provides JWT tokens.
 */
async function login(data) {
  const { error, value } = loginDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { email, password } = value;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createHttpError(401, "Invalid credentials.");
  }

  if (user.status !== "active") {
    throw createHttpError(
      403,
      "Account is inactive or locked. Please activate your account."
    );
  }

  const userPayload = { id: user.id, role: user.role };
  const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(userPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user_id: user.id,
    token: refreshToken,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

/**
 * Generates a new access token using a refresh token.
 */
async function refreshToken(tokenData) {
  const { error, value } = tokenDto.validate(tokenData);
  if (error) throw createHttpError(401, "Refresh token is required.");

  const dbToken = await RefreshToken.findOne({ where: { token: value.token } });
  if (!dbToken) throw createHttpError(401, "Invalid refresh token.");

  if (new Date() > new Date(dbToken.expires_at)) {
    await dbToken.destroy();
    throw createHttpError(403, "Refresh token has expired.");
  }

  try {
    const decoded = jwt.verify(value.token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error();

    const userPayload = { id: user.id, role: user.role };
    const newAccessToken = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return { accessToken: newAccessToken };
  } catch (err) {
    await dbToken.destroy();
    throw createHttpError(403, "Invalid refresh token.");
  }
}

/**
 * Logs a user out by deleting their refresh token.
 */
async function logout(tokenData) {
  const { error, value } = tokenDto.validate(tokenData);
  if (error) return; // If token is missing, just ignore.

  await RefreshToken.destroy({ where: { token: value.token } });
}

/**
 * Activates a user's account with an activation code.
 */
async function activateAccount(data) {
  const { error, value } = verifyCodeDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { email, code } = value;
  const user = await User.findOne({ where: { email, activation_code: code } });
  if (!user) throw createHttpError(400, "Invalid email or activation code.");

  if (new Date() > new Date(user.activation_expires_at)) {
    throw createHttpError(
      400,
      "Activation code has expired. Please request a new one."
    );
  }

  user.status = "active";
  user.activation_code = null;
  user.activation_expires_at = null;
  await user.save();
}

/**
 * Resends the activation code to a user's email.
 */
async function resendActivationCode(data) {
  const { error, value } = emailDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const user = await User.findOne({ where: { email: value.email } });
  if (!user) throw createHttpError(404, "User not found.");
  if (user.status === "active")
    throw createHttpError(400, "This account is already active.");

  const { code, expiresAt } = generateCodeWithExpiration(8, 1440);
  user.activation_code = code;
  user.activation_expires_at = expiresAt;
  await user.save();
  await sendActivationEmail(user.email, code);
}

/**
 * Sends a password reset code to a user's email.
 */
async function requestPasswordReset(data) {
  const { error, value } = emailDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const user = await User.findOne({ where: { email: value.email } });
  if (!user) throw createHttpError(404, "User not found.");

  const { code, expiresAt } = generateCodeWithExpiration(8, 30); // 30 minutes
  user.password_reset_code = code;
  user.password_reset_expires_at = expiresAt;
  await user.save();
  await sendPasswordResetEmail(user.email, code);
}

/**
 * Resets a user's password using a valid reset code.
 */
async function resetPassword(data) {
  const { error, value } = resetPasswordDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { resetCode, newPassword } = value;
  const user = await User.findOne({
    where: { password_reset_code: resetCode },
  });
  if (!user) throw createHttpError(400, "Invalid or expired reset code.");

  if (new Date() > new Date(user.password_reset_expires_at)) {
    throw createHttpError(
      400,
      "Reset code has expired. Please request a new one."
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.password_reset_code = null;
  user.password_reset_expires_at = null;
  await user.save();
}

/**
 * Verifies if a password reset code is valid.
 */
async function verifyResetCode(data) {
  const { error, value } = verifyCodeDto.validate(data);
  if (error) throw createHttpError(400, error.details[0].message);

  const { email, code } = value;
  const user = await User.findOne({
    where: { email, password_reset_code: code },
  });
  if (!user) throw createHttpError(400, "Invalid email or reset code.");

  if (new Date() > new Date(user.password_reset_expires_at)) {
    throw createHttpError(
      400,
      "Reset code has expired. Please request a new one."
    );
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  activateAccount,
  resendActivationCode,
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
};
