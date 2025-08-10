const Joi = require("joi");

// Esquema de Joi para validar la actualización de un slot de disponibilidad.
// Todos los campos son opcionales.
const updateAvailabilitySchema = Joi.object({
  dentist_id: Joi.number().integer().positive(),
  specialty_id: Joi.number().integer().positive(),
  date: Joi.date().iso(),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .messages({
      "string.pattern.base":
        "La hora de inicio debe tener el formato HH:MM:SS.",
    }),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .messages({
      "string.pattern.base": "La hora de fin debe tener el formato HH:MM:SS.",
    }),
})
  // Añade un validador personalizado para el objeto completo
  .custom((value, helpers) => {
    // Solo ejecuta la validación si AMBOS campos están presentes
    if (value.start_time && value.end_time) {
      if (value.start_time >= value.end_time) {
        // Si la hora de fin no es posterior a la de inicio, genera un error.
        return helpers.error("any.invalid", {
          message: "La hora de fin debe ser posterior a la hora de inicio.",
        });
      }
    }

    // Si la validación pasa (o no aplica), devuelve el objeto.
    return value;
  });

module.exports = updateAvailabilitySchema;
