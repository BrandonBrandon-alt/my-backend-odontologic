require('dotenv').config();
const nodemailer = require('nodemailer');

// ======================= CONFIGURACIÓN DEL TRANSPORTADOR =======================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================= FUNCIÓN GENÉRICA PARA ENVIAR EMAIL =======================
async function sendEmail(to, subject, text, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html, // Permite enviar contenido HTML si se proporciona
  });
}

// ======================= EMAIL DE ACTIVACIÓN DE CUENTA =======================
async function sendActivationEmail(email, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>¡Bienvenido a odontologic!</h2>
      <p>Gracias por registrarte. Usa el siguiente código para activar tu cuenta:</p>
      <div style="font-size: 2em; font-weight: bold; color:rgb(255, 109, 199); margin: 20px 0;">${code}</div>
      <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
    </div>
  `;
  await sendEmail(
    email,
    'Activa tu cuenta',
    `Tu código de activación es: ${code}`,
    html
  );
}

// ======================= EMAIL DE RECUPERACIÓN DE CONTRASEÑA =======================
async function sendPasswordResetEmail(email, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Recuperación de contraseña</h2>
      <p>Usa el siguiente código para restablecer tu contraseña:</p>
      <div style="font-size: 2em; font-weight: bold; color:rgb(44, 111, 255); margin: 20px 0;">${code}</div>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  `;
  await sendEmail(
    email,
    'Recupera tu contraseña',
    `Tu código de recuperación es: ${code}`,
    html
  );
}

// ======================= EXPORTS =======================
module.exports = { sendActivationEmail, sendPasswordResetEmail };