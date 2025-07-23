// File: dtos/availability-output.dto.js

const SpecialtyOutputDto = require("../specialty/specialty-output.dto");

/**
 * Data Transfer Object for formatting availability data sent to the client.
 */
class AvailabilityOutputDto {
  constructor(availabilityModel) {
    this.id = availabilityModel.id;
    this.date = availabilityModel.date;
    this.startTime = availabilityModel.start_time;
    this.endTime = availabilityModel.end_time;

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
