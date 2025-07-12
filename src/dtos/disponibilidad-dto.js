// src/dtos/disponibilidad.dto.js
const DentistOutputDto = require('./dentist-dto'); // Asegúrate de la ruta correcta
const EspecialidadOutputDto = require('./especialidad-dto'); // Asegúrate de la ruta correcta

class DisponibilidadOutputDto {
  constructor(disponibilidadModel) {
    this.id = disponibilidadModel.id;
    this.date = disponibilidadModel.date;
    this.start_time = disponibilidadModel.start_time;
    this.end_time = disponibilidadModel.end_time;
    this.is_active = disponibilidadModel.is_active; // También es bueno incluir el estado activo

    // Si 'dentist' y 'especialidad' están incluidos en el modelo
    // y no son nulos, crea sus DTOs anidados.
    if (disponibilidadModel.dentist) {
      this.dentist = new DentistOutputDto(disponibilidadModel.dentist);
    }
    if (disponibilidadModel.especialidad) {
      this.especialidad = new EspecialidadOutputDto(disponibilidadModel.especialidad);
    }
  }

  static fromList(disponibilidadesList) {
    return disponibilidadesList.map(disp => new DisponibilidadOutputDto(disp));
  }
}

module.exports = DisponibilidadOutputDto;
