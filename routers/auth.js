const express = require("express");
const router = express.Router();
const createUser = require("../dto/registroDTO");
const login = require("../dto/loginDTO");
const bcrypt = require("bcrypt");
const { User } = require("../models/user"); // Asegúrate de que la ruta sea correcta
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize"); // <-- Agrega esta línea
const {
  sendActivationEmail,
} = require("../utils/mailer"); // Asegúrate de que la ruta sea correcta

const refreshTokens = [];
const activationCode = crypto.randomBytes(3).toString("hex");

router.post("/registro", async (req, res) => {
  const { error } = createUser.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, idNumber, email, password, phone } = req.body;

  // Encriptar la contraseña
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
      role: "user", // Asignar rol por defecto
      status: "inactive",
      activation_code: activationCode,
    });
    await sendActivationEmail(email, activationCode); // <-- Agrega esto
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: { ...user.toJSON(), password: undefined },
    });
  } catch (err) {
    console.error("Error al registrar usuario:", err); // <-- Agrega esto
    res
      .status(500)
      .json({ error: "Error al registrar usuario", details: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { error } = login.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    // Buscar usuario en la base de datos
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    // Comparar contraseñas
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
    refreshTokens.push(refreshToken); // <-- Corrige aquí

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

// (Opcional) Logout
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  const index = refreshTokens.indexOf(refreshToken);
  if (index > -1) refreshTokens.splice(index, 1);
  res.json({ message: "Logout exitoso" });
});

module.exports = router;
