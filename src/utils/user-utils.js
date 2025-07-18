// Función para limpiar datos sensibles de un usuario
function sanitizeUser(user) {
    if (!user) return null;
    const obj = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete obj.password;
    delete obj.activation_code;
    delete obj.activation_expires_at;
    delete obj.password_reset_code;
    delete obj.password_reset_expires_at;
    return obj;
}

module.exports = { sanitizeUser }; 