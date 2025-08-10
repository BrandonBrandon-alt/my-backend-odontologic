/**
 * Utilidades para tokens de confirmación de citas.
 * - Genera un token determinista basado en datos de la cita y tiempo actual (hash SHA-256).
 * - Verificación placeholder (debe implementarse en producción).
 * - Genera URL de confirmación con query params `token` y `email`.
 */
const crypto = require("crypto");

// Función para generar un token de confirmación seguro
function generateConfirmationToken(appointmentId, patientEmail) {
  const data = `${appointmentId}:${patientEmail}:${Date.now()}`; // Incluye timestamp para unicidad
  return crypto.createHash("sha256").update(data).digest("hex"); // Hash en hexadecimal
}

// Función para verificar un token de confirmación
function verifyConfirmationToken(token, appointmentId, patientEmail) {
  // Por simplicidad, aquí podrías implementar una verificación más robusta
  // como almacenar tokens en base de datos con expiración
  return true; // Por ahora retornamos true, pero deberías implementar verificación real
}

// Función para generar URL de confirmación
function generateConfirmationUrl(appointmentId, patientEmail, baseUrl) {
  const token = generateConfirmationToken(appointmentId, patientEmail);
  return `${baseUrl}/api/appointments/confirm/${appointmentId}?token=${token}&email=${encodeURIComponent(
    patientEmail
  )}`;
}

module.exports = {
  generateConfirmationToken,
  verifyConfirmationToken,
  generateConfirmationUrl,
};
