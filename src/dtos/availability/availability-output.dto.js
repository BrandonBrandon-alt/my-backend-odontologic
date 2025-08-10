/**
 * DTO de salida de Disponibilidad (AvailabilityOutputDto).
 * Formatea un registro de disponibilidad para la respuesta del API,
 * incluyendo dentista y especialidad cuando vienen incluidas en la consulta.
 */
// File: dtos/availability-output.dto.js

const SpecialtyOutputDto = require("../specialty/specialty-output.dto");

/**
 * Data Transfer Object for formatting availability data sent to the client.
 */
class AvailabilityOutputDto {
  constructor(availabilityModel) {
    this.id = availabilityModel.id;
    this.date = availabilityModel.date; // Fecha YYYY-MM-DD
    this.startTime = availabilityModel.start_time; // Hora inicio HH:MM:SS
    this.endTime = availabilityModel.end_time; // Hora fin HH:MM:SS

    // Format the nested dentist object
    if (availabilityModel.dentist) {
      this.dentist = {
        id: availabilityModel.dentist.id,
        name: availabilityModel.dentist.name,
      };
    }

    // Format the nested specialty object using its own DTO
    if (availabilityModel.specialty) {
      this.specialty = new SpecialtyOutputDto(availabilityModel.specialty);
    }
  }

  static fromList(availabilitiesList) {
    return availabilitiesList.map((av) => new AvailabilityOutputDto(av));
  }
}

module.exports = AvailabilityOutputDto;
