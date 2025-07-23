const SpecialtyOutputDto = require('./specialty-output.dto');

/**
 * Data Transfer Object for formatting service type data sent to the client.
 * It handles the nested specialty object to ensure a consistent API response.
 */
class ServiceTypeOutputDto {
  constructor(serviceTypeModel) {
    this.id = serviceTypeModel.id;
    this.name = serviceTypeModel.name;
    this.description = serviceTypeModel.description;
    this.duration = serviceTypeModel.duration;
    this.isActive = serviceTypeModel.is_active;

    // If 'specialty' was included in the query and is not null,
    // format it using its own DTO.
    if (serviceTypeModel.specialty) {
      this.specialty = new SpecialtyOutputDto(serviceTypeModel.specialty);
    }
  }

  /**
   * A static helper method to convert a list of ServiceType model instances
   * into a list of DTOs.
   * @param {Array<ServiceType>} serviceTypesList - An array of Sequelize service type models.
   * @returns {Array<ServiceTypeOutputDto>} A list of formatted service type objects.
   */
  static fromList(serviceTypesList) {
    return serviceTypesList.map(st => new ServiceTypeOutputDto(st));
  }
}

module.exports = ServiceTypeOutputDto;
