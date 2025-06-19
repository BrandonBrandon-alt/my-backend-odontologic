// routers/auth.js

const express = require("express");
const router = express.Router(); // <<-- Define el router aquí
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");

// Importa los middlewares y los DTOs
const { authenticateToken } = require('../middleware/authMiddleware');
// const { authorizeRoles } = require('../middleware/authMiddleware'); // Importa authorizeRoles si lo usas en este router
const createUser = require("../dto/registroDTO");
const login = require("../dto/loginDTO");
const resetPassword = require("../dto/resetPasswordDTO"); // Usado para el DTO de cambiar-password-reset

// Importa tu modelo de usuario
const { User } = require("../models/user");

// Importa tu módulo de mailer
const { sendActivationEmail, sendPasswordResetEmail } = require("../utils/mailer");

console.log('NODE_ENV when auth router is loaded:', process.env.NODE_ENV); // Esto está bien para depuración

// Variable para almacenar refresh tokens (en un entorno real, esto sería una base de datos o caché)
const refreshTokens = []; // <<-- Asegúrate de que esta variable esté declarada aquí

// ===============================================================
// FUNCIONES DE UTILIDAD PARA GESTIÓN DE CÓDIGOS
// ===============================================================

function generateCodeWithExpiration(bytes = 2, expiresInMinutes = 60) {
  const code = crypto.randomBytes(bytes).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  return { code, expiresAt };
}

// ======================= REGISTRO =======================
router.post("/registro", async (req, res) => {
  try {
    const { error } = createUser.validate(req.body);
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
      profile_picture: null,
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

    // Re-generar un accessToken con la misma información del usuario del refreshToken
    const accessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
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

    const { code: newActivationCode, expiresAt: newActivationExpiresAt } = generateCodeWithExpiration(8, 1440);

    user.activation_code = newActivationCode;
    user.activation_expires_at = newActivationExpiresAt;
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

    const { code: newResetCode, expiresAt: newResetExpiresAt } = generateCodeWithExpiration(8, 30);

    user.password_reset_code = newResetCode;
    user.password_reset_expires_at = newResetExpiresAt;
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
  console.log('>>> Inside POST /logout <<<');
  const { refreshToken } = req.body;
  console.log('Received refreshToken in request body:', refreshToken);
  console.log('Current refreshTokens array BEFORE removal:', refreshTokens);

  const index = refreshTokens.indexOf(refreshToken);
  console.log('Index found for refreshToken:', index);

  if (index > -1) {
    refreshTokens.splice(index, 1);
    console.log('refreshToken removed. Array AFTER removal:', refreshTokens);
  } else {
    console.log('refreshToken not found in array (index is -1). Array remains:', refreshTokens);
  }

  res.json({ message: "Logout exitoso" });
  console.log('<<< Exiting POST /logout >>>');
});

// ======================= EXPORTACIONES =======================
// Este bloque final maneja la exportación del módulo.
// EXPORTACIÓN CONDICIONAL:
// Si NODE_ENV es 'test', exporta un OBJETO con el router y las funciones de testing.
// De lo contrario (ej. 'development', 'production'), solo exporta el router.
if (process.env.NODE_ENV === 'test') {
  module.exports = {
    router: router, // El objeto Express Router
    getRefreshTokens: () => refreshTokens, // Función para obtener los tokens de refresco (solo para tests)
    clearRefreshTokens: () => { refreshTokens.length = 0; }, // Función para limpiar los tokens de refresco (solo para tests)
  };
} else {
  // Para producción o desarrollo, simplemente exporta el router
  module.exports = router;
}