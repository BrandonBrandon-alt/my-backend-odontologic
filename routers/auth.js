const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize"); // Asegúrate de que Op esté disponible

const createUser = require("../dto/registroDTO"); // <-- CORRECCIÓN: 'dtos' (plural) y 'createUser.dto'
const login = require("../dto/loginDTO");
const resetPassword = require("../dto/resetPasswordDTO");

// Importa tu modelo de usuario (ajusta la ruta según tu estructura real)
const { User } = require("../models/user");

// Importa tu módulo de mailer (ajusta la ruta según tu estructura real)
const {
  sendActivationEmail,
  sendPasswordResetEmail
} = require("../utils/mailer");

// Variable para almacenar refresh tokens (en un entorno real, esto sería una base de datos o caché)
const refreshTokens = [];

// ===============================================================
// NUEVAS FUNCIONES DE UTILIDAD PARA GESTIÓN DE CÓDIGOS
// ===============================================================

/**
 * Generates a random code and an expiration time.
 * @param {number} bytes - Number of bytes to generate the code (e.g., 8 for 16 hex characters).
 * @param {number} expiresInMinutes - Code validity duration in minutes.
 * @returns {{code: string, expiresAt: Date}}
 */
function generateCodeWithExpiration(bytes = 8, expiresInMinutes = 60) {
  const code = crypto.randomBytes(bytes).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000); // Adds minutes to the current date
  return { code, expiresAt };
}

// ======================= REGISTRO =======================
router.post("/registro", async (req, res) => {
  try {
    // 1. Validate the request body data with Joi
    const { error } = createUser.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // 2. Destructure all fields
    const { name, idNumber, email, password, phone, address, birth_date } = req.body;

    // 3. Check if a user with that id_number or email already exists
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
    // Use the new utility to generate the activation code with expiration (e.g., 24 hours)
    const { code: activationCode, expiresAt: activationExpiresAt } = generateCodeWithExpiration(8, 1440); // 1440 minutes = 24 hours

    // 4. Create the object to save to the database
    const userToCreate = {
      name,
      id_number: idNumber,
      email,
      password: hashedPassword,
      phone,
      address: address || null,
      // Ensure that birth_date is converted to Date if it exists
      birth_date: birth_date ? new Date(birth_date) : null,
      profile_picture: null, // Assign null as no image will be uploaded in this flow
      role: "user",
      status: "inactive",
      activation_code: activationCode,
      activation_expires_at: activationExpiresAt, // Save the expiration time
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
});

// ======================= LOGIN =======================
router.post("/login", async (req, res) => {
  const { error } = login.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
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
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
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
});

// ======================= REFRESH TOKEN =======================
router.post("/token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "Refresh token requerido" });
  if (!refreshTokens.includes(refreshToken))
    return res.status(403).json({ error: "Refresh token inválido" });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Refresh token inválido" });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token: accessToken });
  });
});

// ======================= ACTIVACIÓN DE CUENTA =======================
router.post("/activar", async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ where: { email, activation_code: code } });
    if (!user) {
      return res.status(400).json({ error: "Código o correo incorrecto" });
    }

    // ADDED: Check if the code has expired
    if (user.activation_expires_at && new Date() > user.activation_expires_at) {
      // Optional: you could generate a new code here and ask the user to resend
      return res.status(400).json({ error: "El código de activación ha expirado. Por favor, solicita uno nuevo." });
    }

    user.status = "active";
    user.activation_code = null;
    user.activation_expires_at = null; // Clear the expiration date as well
    await user.save();
    res.json({ message: "Cuenta activada correctamente" });
  } catch (err) {
    console.error('Error al activar cuenta:', err);
    res.status(500).json({ error: "Error al activar cuenta", details: err.message });
  }
});

// ======================= REENVÍO DE CÓDIGO DE ACTIVACIÓN =======================
router.post("/reenviar-activacion", async (req, res) => {
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

    // Use the new utility to generate a new activation code with expiration
    const { code: newActivationCode, expiresAt: newActivationExpiresAt } = generateCodeWithExpiration(8, 1440); // 24 hours

    user.activation_code = newActivationCode;
    user.activation_expires_at = newActivationExpiresAt; // Update the expiration date
    await user.save();

    await sendActivationEmail(email, newActivationCode);

    res.json({ message: "Código de activación reenviado correctamente. Revisa tu correo." });
  } catch (err) {
    res.status(500).json({ error: "Error al reenviar código", details: err.message });
  }
});

// ======================= SOLICITUD DE CÓDIGO DE RECUPERACIÓN =======================
router.post("/solicitar-reset", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "El correo es obligatorio" });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Use the new utility to generate the reset code with expiration (e.g., 30 minutes)
    const { code: resetCode, expiresAt: resetExpiresAt } = generateCodeWithExpiration(8, 30); // 30 minutes

    user.password_reset_code = resetCode;
    user.password_reset_expires_at = resetExpiresAt; // Save the expiration time
    await user.save();

    await sendPasswordResetEmail(email, resetCode);

    res.json({ message: "Código de recuperación enviado correctamente. Revisa tu correo." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error al solicitar recuperación", details: err.message });
  }
});

// ======================= REENVÍO DE CÓDIGO DE RECUPERACIÓN =======================
router.post("/reenviar-reset", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "El correo es obligatorio" });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Reuse the utility to generate a new reset code
    const { code: newResetCode, expiresAt: newResetExpiresAt } = generateCodeWithExpiration(8, 30); // 30 minutes

    user.password_reset_code = newResetCode;
    user.password_reset_expires_at = newResetExpiresAt; // Update the expiration date
    await user.save();

    await sendPasswordResetEmail(email, newResetCode);
    res.json({ message: "Código de recuperación reenviado correctamente. Revisa tu correo." });
  } catch (err) {
    res.status(500).json({ error: "Error al reenviar código de recuperación", details: err.message });
  }
});

// ======================= CAMBIO DE CONTRASEÑA POR CÓDIGO DE RECUPERACIÓN =======================
router.post("/cambiar-password-reset", async (req, res) => {
  const { error } = resetPassword.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { password_reset_code, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { password_reset_code } });
    if (!user) {
      return res.status(400).json({ error: "Código de recuperación inválido o ya utilizado" });
    }

    // ADDED: Check if the reset code has expired
    if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
        return res.status(400).json({ error: "El código de recuperación ha expirado. Por favor, solicita uno nuevo." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.password_reset_code = null; // Clear the code after use
    user.password_reset_expires_at = null; // Clear the expiration date as well
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar contraseña", details: err.message });
  }
});

// ======================= VERIFICAR CÓDIGO DE RECUPERACIÓN =======================
router.post("/verificar-reset", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "El correo y el código son obligatorios" });
  }

  try {
    const user = await User.findOne({ where: { email, password_reset_code: code } });
    if (!user) {
      return res.status(400).json({ error: "Código o correo incorrecto" });
    }
    // ADDED: Check if the reset code has expired
    if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
        return res.status(400).json({ error: "El código de recuperación ha expirado. Por favor, solicita uno nuevo." });
    }

    res.json({ message: "Código válido" });
  } catch (err) {
    res.status(500).json({ error: "Error al verificar el código", details: err.message });
  }
});

// ======================= LOGOUT (Opcional) =======================
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  const index = refreshTokens.indexOf(refreshToken);
  if (index > -1) refreshTokens.splice(index, 1);
  res.json({ message: "Logout exitoso" });
});

module.exports = router;
