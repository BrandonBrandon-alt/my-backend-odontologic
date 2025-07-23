const { User } = require("../models/index");
const changePasswordDto = require("../dtos/user/change-password.dto");
const updateProfileDto = require("../dtos/user/update-profile.dto");
const bcrypt = require("bcrypt");

/**
 * Creates a standard error object with a status code.
 * @param {number} status - The HTTP status code.
 * @param {string} message - The error message.
 * @returns {Error} A new error object with a status property.
 */
const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Fetches a user's profile by their ID.
 * @param {number} userId - The ID of the user to retrieve.
 * @returns {Promise<User>} The user object without the password.
 * @throws {Error} Throws a 404 error if the user is not found.
 */
async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
}

/**
 * Changes a user's password after validating the current one.
 * @param {number} userId - The ID of the user.
 * @param {object} body - The request body containing passwords.
 * @param {string} body.currentPassword - The user's current password.
 * @param {string} body.newPassword - The desired new password.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {Error} Throws validation, not found, or authorization errors.
 */
async function changePassword(userId, body) {
  const { error } = changePasswordDto.validate(body);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const { currentPassword, newPassword } = body;
  const user = await User.findByPk(userId);
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw createHttpError(401, "Incorrect current password");
  }

  const isNewSameAsCurrent = await bcrypt.compare(newPassword, user.password);
  if (isNewSameAsCurrent) {
    throw createHttpError(
      400,
      "New password cannot be the same as the current one"
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: "Password updated successfully." };
}

/**
 * Updates a user's profile information.
 * @param {number} userId - The ID of the user to update.
 * @param {object} body - The new data for the user's profile.
 * @returns {Promise<{user: object, message: string}>} The updated user object and a success message.
 * @throws {Error} Throws validation or not found errors.
 */
async function updateProfile(userId, body) {
  const { error, value: validatedData } = updateProfileDto.validate(body);
  if (error) {
    throw createHttpError(400, error.details[0].message);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  await user.update(validatedData);

  // Return the user data but exclude the password for security
  const userWithoutPassword = user.get({ plain: true });
  delete userWithoutPassword.password;

  return {
    user: userWithoutPassword,
    message: "Profile updated successfully.",
  };
}

module.exports = {
  getProfile,
  changePassword,
  updateProfile,
};
