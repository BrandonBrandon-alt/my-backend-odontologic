const express = require("express");
const router = express.Router();
const createUser = require("../dto/registroDTO");
const login = require("../dto/loginDTO");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const resetPassword = require("../dto/resetPasswordDTO");
const {
  sendActivationEmail,
  sendPasswordResetEmail
} = require("../utils/mailer");

const refreshTokens = [];
const activationCode = crypto.randomBytes(3).toString("hex");

// ======================= REGISTRO =======================
router.post("/registro", async (req, res) => {
  const { error } = createUser.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, idNumber, email, password, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Verifica si ya existe un usuario con ese id_number o email
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
    // Guardar usuario en la base de datos
    const user = await User.create({
      name,
      id_number: idNumber,
      email,
      password: hashedPassword,
      phone,
      role: "user",
      status: "inactive",
      activation_code: activationCode,
    });
    await sendActivationEmail(email, activationCode);
    res.status(201).json({
      message: "Usuario registrado exitosamente",
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
      return res.status(403).json({ error: "Cuenta inactiva o bloqueada" });
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

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Refresh token inválido" });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token: accessToken });
  });
});

// ======================= ACTIVACIÓN DE CUENTA =======================
router.post("/activar", async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ where: { email, activation_code: code } });
  if (!user) {
    return res.status(400).json({ error: "Código o correo incorrecto" });
  }
  user.status = "active";
  user.activation_code = null;
  await user.save();
  res.json({ message: "Cuenta activada correctamente" });
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

    // Genera un nuevo código de activación
    const newActivationCode = crypto.randomBytes(3).toString("hex");
    user.activation_code = newActivationCode;
    await user.save();

    await sendActivationEmail(email, newActivationCode);

    res.json({ message: "Código de activación reenviado correctamente" });
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

    let resetCode = user.password_reset_code;
    if (!resetCode) {
      resetCode = crypto.randomBytes(3).toString("hex");
      user.password_reset_code = resetCode;
      await user.save();
    }

    await sendPasswordResetEmail(email, resetCode);

    res.json({ message: "Código de recuperación enviado correctamente" });
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
    let resetCode = user.password_reset_code;
    if (!resetCode) {
      resetCode = crypto.randomBytes(3).toString("hex");
      user.password_reset_code = resetCode;
      await user.save();
    }
    await sendPasswordResetEmail(email, resetCode);
    res.json({ message: "Código de recuperación reenviado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al reenviar código", details: err.message });
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
      return res.status(400).json({ error: "Código de recuperación inválido" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.password_reset_code = null;
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