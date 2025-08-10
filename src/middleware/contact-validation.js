/**
 * Middleware de validación de datos de contacto usando express-validator.
 * Define reglas para nombre, email, teléfono, asunto y mensaje; y un manejador
 * para formatear y devolver errores de validación.
 */
const { body, validationResult } = require('express-validator');

// Reglas de validación para el formulario de contacto
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('El email no tiene un formato válido')
    .isLength({ max: 255 })
    .withMessage('El email es demasiado largo'),
    
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('El teléfono es demasiado largo')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('El teléfono no tiene un formato válido'),
    
  body('subject')
    .isIn(['consulta', 'cita', 'emergencia', 'presupuesto', 'otro'])
    .withMessage('El asunto seleccionado no es válido')
    .isLength({ max: 50 })
    .withMessage('El asunto es demasiado largo'),
    
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('El mensaje debe tener entre 10 y 1000 caracteres')
    .escape()
    .withMessage('El mensaje contiene caracteres no permitidos')
];

// Middleware para manejar y formatear errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: errors.array().reduce((acc, error) => {
        acc[error.path] = [error.msg];
        return acc;
      }, {})
    });
  }
  next();
};

module.exports = { contactValidation, handleValidationErrors }; 