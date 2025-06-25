// src/dtos/dentist.dto.js
class DentistOutputDto {
  constructor(userModel) {
    this.id = userModel.id;
    this.name = userModel.name;
    // Podrías añadir más campos aquí si los necesitas en el frontend,
    // pero solo los esenciales para evitar exponer datos sensibles.
  }
}

module.exports = DentistOutputDto;
