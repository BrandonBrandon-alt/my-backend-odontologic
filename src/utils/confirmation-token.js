const crypto = require('crypto');

// Función para generar un token de confirmación seguro
function generateConfirmationToken(appointmentId, patientEmail) {
  const data = `${appointmentId}:${patientEmail}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
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
  return `${baseUrl}/api/appointments/confirm/${appointmentId}?token=${token}&email=${encodeURIComponent(patientEmail)}`;
}

module.exports = {
  generateConfirmationToken,
  verifyConfirmationToken,
  generateConfirmationUrl
}; 