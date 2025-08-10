/**
 * Utilidades para envío de correos electrónicos con Nodemailer.
 * - Configura el transporter (Gmail) usando variables de entorno.
 * - Proporciona helpers para distintos correos (activación, recuperación, contacto, confirmación de cita).
 * - Incluye un layout base reutilizable con paleta de colores.
 */
require('dotenv').config(); // Asegúrate de que esto se ejecute al inicio de tu aplicación para cargar las variables de entorno
const e = require('cors');
const nodemailer = require('nodemailer');
const { generateConfirmationUrl } = require('./confirmation.token');

// Define los colores de tu paleta directamente como constantes para usar en el HTML inline
// Esto asegura la compatibilidad con la mayoría de los clientes de correo.
const COLORS = {
  primary: '#009688',         // Verde azulado
  primaryDarker: '#004D40',  // Verde oscuro
  secondary: '#B2DFDB',       // Verde agua claro
  accent: '#00B8D4',          // Celeste acento
  backgroundLight: '#F5F5F5',// Gris muy claro
  backgroundDark: '#e8ddea', // Fondo alternativo suave
  textDark: '#004D40',       // Gris azulado oscuro
  success: '#4caf50',         // Verde éxito
  error: '#e53935',           // Rojo error
};

// ======================= CONFIGURACIÓN DEL TRANSPORTADOR =======================
// Configura el transporter de Nodemailer usando Gmail (requiere credenciales válidas)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================= FUNCIÓN GENÉRICA PARA ENVIAR EMAIL =======================
// Envoltorio para enviar correos con manejo de errores uniforme
async function sendEmail(to, subject, text, html) {
  try {
    await transporter.sendMail({
      from: `Odontologic <${process.env.EMAIL_USER}>`, // Nombre del remitente
      to,
      subject,
      text,
      html,
    });
    console.log(`Correo enviado a ${to} con asunto: ${subject}`);
  } catch (error) {
    console.error(`Error al enviar correo a ${to}:`, error);
    // Propaga el error para que pueda ser capturado por el try/catch del controlador
    throw new Error('No se pudo enviar el correo electrónico.');
  }
}

// ======================= LAYOUT BASE DE EMAIL =======================
// Genera un HTML base para envolver el contenido de cada correo
function getBaseEmailLayout(contentHtml) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: ${COLORS.backgroundLight}; margin: 0; padding: 20px; color: ${COLORS.textDark};">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color: ${COLORS.primary}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Odontologic</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            ${contentHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: ${COLORS.primaryDarker}; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #ffffff; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Odontologic. Todos los derechos reservados.</p>
            <p style="color: ${COLORS.secondary}; font-size: 11px; margin: 5px 0 0;">Este es un correo automático, por favor no respondas.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ======================= EMAIL DE ACTIVACIÓN DE CUENTA =======================
// Construye y envía el correo de activación con el código proporcionado
async function sendActivationEmail(email, code) {
  const content = `
    <h2 style="color: ${COLORS.primaryDarker}; font-size: 20px; margin-top: 0;">¡Bienvenido a Odontologic!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Gracias por registrarte. Usa el siguiente código para activar tu cuenta:</p>
    <div style="font-size: 2.5em; font-weight: bold; color: ${COLORS.primary}; text-align: center; padding: 15px; background-color: ${COLORS.secondary}; border-radius: 5px; margin: 25px 0;">${code}</div>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Este código es válido por un tiempo limitado. Por favor, actívalo pronto.</p>
    <p style="font-size: 12px; color: #888; margin-top: 20px;">Si no solicitaste este registro, puedes ignorar este correo.</p>
  `;
  const html = getBaseEmailLayout(content);

  await sendEmail(
    email,
    'Odontologic: Activa tu cuenta',
    `Tu código de activación de Odontologic es: ${code}. Si no solicitaste esto, ignora este correo.`,
    html
  );
}

// ======================= EMAIL DE RECUPERACIÓN DE CONTRASEÑA =======================
// Construye y envía el correo de recuperación con el código de restablecimiento
async function sendPasswordResetEmail(email, code) {
  const content = `
    <h2 style="color: ${COLORS.primaryDarker}; font-size: 20px; margin-top: 0;">Recuperación de Contraseña</h2>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Usa el siguiente código para restablecer tu contraseña:</p>
    <div style="font-size: 2.5em; font-weight: bold; color: ${COLORS.accent}; text-align: center; padding: 15px; background-color: ${COLORS.backgroundDark}; border-radius: 5px; margin: 25px 0;">${code}</div>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Este código es válido por un tiempo limitado.</p>
    <p style="font-size: 12px; color: #888; margin-top: 20px;">Si no solicitaste este cambio de contraseña, ignora este correo.</p>
  `;
  const html = getBaseEmailLayout(content);

  await sendEmail(
    email,
    'Odontologic: Recupera tu Contraseña',
    `Tu código de recuperación de contraseña de Odontologic es: ${code}. Si no solicitaste esto, ignora este correo.`,
    html
  );
}

// ======================= EMAIL DE CONFIRMACIÓN DE CITA =======================
/**
 * Envía un correo electrónico de confirmación de cita.
 * @param {string} to - Dirección de correo electrónico del paciente.
 * @param {object} appointmentDetails - Detalles de la cita.
 * @param {string} appointmentDetails.patientName - Nombre completo del paciente.
 * @param {string} appointmentDetails.patientEmail - Email del paciente.
 * @param {string} appointmentDetails.patientPhone - Teléfono del paciente.
 * @param {string} [appointmentDetails.patientIdNumber] - Número de identificación del paciente (opcional).
 * @param {string} [appointmentDetails.patientNotes] - Notas adicionales del paciente (opcional).
 * @param {string} appointmentDetails.doctorName - Nombre del doctor.
 * @param {string} appointmentDetails.specialtyName - Nombre de la especialidad.
 * @param {string} appointmentDetails.serviceTypeName - Nombre del tipo de servicio.
 * @param {string} appointmentDetails.serviceTypeDescription - Descripción del tipo de servicio.
 * @param {number} appointmentDetails.serviceTypeDuration - Duración del servicio en minutos.
 * @param {string} appointmentDetails.appointmentDate - Fecha de la cita (ej. "YYYY-MM-DD").
 * @param {string} appointmentDetails.appointmentStartTime - Hora de inicio de la cita (ej. "HH:MM").
 * @param {string} appointmentDetails.appointmentEndTime - Hora de fin de la cita (ej. "HH:MM").
 * @param {string} appointmentDetails.appointmentId - ID único de la cita.
 * @param {string} baseUrl - URL base de la aplicación para generar el enlace de confirmación.
 */
async function sendAppointmentConfirmationEmail(to, appointmentDetails, baseUrl = process.env.BASE_URL || 'http://localhost:3000') {
  const {
    patientName,
    patientEmail,
    patientPhone,
    patientIdNumber,
    patientNotes,
    doctorName,
    specialtyName,
    serviceTypeName,
    serviceTypeDescription,
    serviceTypeDuration,
    appointmentDate,
    appointmentStartTime,
    appointmentEndTime,
    appointmentId
  } = appointmentDetails;

  // Generar URL de confirmación
  const confirmationUrl = generateConfirmationUrl(appointmentId, patientEmail, baseUrl);

  // Formatear la fecha y hora para el correo
  const formattedDate = new Date(appointmentDate).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedStartTime = new Date(`2000-01-01T${appointmentStartTime}`).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const formattedEndTime = new Date(`2000-01-01T${appointmentEndTime}`).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const content = `
    <h2 style="color: ${COLORS.primaryDarker}; font-size: 20px; margin-top: 0;">¡Cita Confirmada!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Tu cita en Odontologic ha sido confirmada exitosamente. Aquí están los detalles:</p>

    <div style="background-color: ${COLORS.backgroundLight}; border-left: 4px solid ${COLORS.primary}; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: ${COLORS.primaryDarker}; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Detalles de la Cita #${appointmentId}</h3>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Fecha:</strong> <span style="color: ${COLORS.textDark};">${formattedDate}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Hora:</strong> <span style="color: ${COLORS.textDark};">${formattedStartTime} - ${formattedEndTime}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Doctor(a):</strong> <span style="color: ${COLORS.textDark};">${doctorName} (${specialtyName})</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Servicio:</strong> <span style="color: ${COLORS.textDark};">${serviceTypeName}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Descripción del Servicio:</strong> <span style="color: ${COLORS.textDark};">${serviceTypeDescription}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Duración Estimada:</strong> <span style="color: ${COLORS.textDark};">${formatDuration(serviceTypeDuration)}</span></p>
    </div>

    <div style="margin-top: 25px; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <h3 style="color: ${COLORS.textDark}; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Información del Paciente</h3>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Email:</strong> ${patientEmail}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Teléfono:</strong> ${patientPhone}</p>
        ${patientIdNumber ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Identificación:</strong> ${patientIdNumber}</p>` : ''}
        ${patientNotes ? `<p style="font-size: 14px; margin: 5px 0;"><strong>Notas:</strong> ${patientNotes}</p>` : ''}
    </div>

    <div style="margin-top: 25px; background-color: ${COLORS.backgroundDark}; border-left: 4px solid ${COLORS.accent}; padding: 15px; border-radius: 5px;">
      <h3 style="color: ${COLORS.textDark}; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Información Importante:</h3>
      <ul style="font-size: 13px; line-height: 1.5; color: ${COLORS.textDark}; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 5px;">Llega al menos 10 minutos antes de tu cita para el registro.</li>
        <li style="margin-bottom: 5px;">Trae contigo tu documento de identidad.</li>
        <li style="margin-bottom: 5px;">Si tienes estudios previos relevantes, por favor tráelos.</li>
        <li style="margin-bottom: 5px;">En caso de necesitar cancelar o reprogramar, hazlo con al menos 24 horas de anticipación.</li>
      </ul>
    </div>

    <!-- Botón de Confirmación -->
    <div style="margin-top: 30px; text-align: center;">
      <a href="${confirmationUrl}" style="display: inline-block; background-color: ${COLORS.success}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        ✅ Confirmar Mi Cita
      </a>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:<br>
        <a href="${confirmationUrl}" style="color: ${COLORS.primary}; word-break: break-all;">${confirmationUrl}</a>
      </p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark}; margin-top: 25px;">¡Esperamos verte pronto!</p>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.primaryDarker}; font-weight: bold;">Equipo de Odontologic</p>
  `;
  const html = getBaseEmailLayout(content);

  await sendEmail(
    to,
    `Odontologic: ¡Tu Cita #${appointmentId} ha sido Confirmada!`,
    `Hola ${patientName}, tu cita con el Dr. ${doctorName} para ${serviceTypeName} el ${formattedDate} a las ${formattedStartTime} ha sido confirmada. Para confirmar tu cita, visita: ${confirmationUrl}`,
    html
  );
}

// ======================= EMAIL DE CONFIRMACIÓN DE CONTACTO =======================
// Envío de acuse de recibo al usuario que completó el formulario de contacto
async function sendConfirmationEmail(userEmail, userName) {
  const content = `
    <h2 style="color: ${COLORS.primaryDarker}; font-size: 20px; margin-top: 0;">¡Gracias por contactarnos!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Hola ${userName},</p>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.</p>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark};">Mientras tanto, puedes visitar nuestra página web para más información.</p>
    <br>
    <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.primaryDarker}; font-weight: bold;">Saludos,<br>Equipo de Odontologic</p>
  `;
  const html = getBaseEmailLayout(content);

  await sendEmail(
    userEmail,
    'Gracias por contactarnos - Odontologic',
    `Hola ${userName}, hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.`,
    html
  );
}

// ======================= EMAIL DE NOTIFICACIÓN DE CONTACTO =======================
// Notificación al administrador con el contenido del mensaje recibido
async function sendNotificationEmail(contactMessage) {
  const content = `
    <h2 style="color: ${COLORS.error}; font-size: 20px; margin-top: 0;">Nuevo mensaje de contacto</h2>
    <div style="background-color: ${COLORS.backgroundLight}; border-left: 4px solid ${COLORS.primary}; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 14px; margin: 5px 0;"><strong>De:</strong> <span style="color: ${COLORS.textDark};">${contactMessage.name}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Email:</strong> <span style="color: ${COLORS.textDark};">${contactMessage.email}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Teléfono:</strong> <span style="color: ${COLORS.textDark};">${contactMessage.phone || 'No proporcionado'}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Asunto:</strong> <span style="color: ${COLORS.textDark};">${contactMessage.subject}</span></p>
      <p style="font-size: 14px; margin: 5px 0;"><strong>Fecha:</strong> <span style="color: ${COLORS.textDark};">${new Date(contactMessage.createdAt).toLocaleString('es-CO')}</span></p>
    </div>
    
    <div style="background-color: ${COLORS.backgroundDark}; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: ${COLORS.textDark}; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Mensaje:</h3>
      <p style="font-size: 14px; line-height: 1.6; color: ${COLORS.textDark}; margin: 0;">${contactMessage.message}</p>
    </div>
  `;
  const html = getBaseEmailLayout(content);

  await sendEmail(
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    `Nuevo mensaje de contacto - ${contactMessage.subject}`,
    `Nuevo mensaje de ${contactMessage.name} (${contactMessage.email}): ${contactMessage.message}`,
    html
  );
}

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendConfirmationEmail,
  sendNotificationEmail
};