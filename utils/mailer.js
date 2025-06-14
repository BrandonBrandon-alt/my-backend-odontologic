require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendActivationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // O tu proveedor SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de activación',
    text: `Tu código de activación es: ${code}`,
  });
}

module.exports = { sendActivationEmail };