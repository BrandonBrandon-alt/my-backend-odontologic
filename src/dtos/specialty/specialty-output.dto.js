/**
 * Data Transfer Object for formatting specialty data sent to the client.
 * This ensures a consistent and clean structure for API responses.
 */
class SpecialtyOutputDto {
  constructor(specialtyModel) {
    this.id = specialtyModel.id;
    this.name = specialtyModel.name;
    this.description = specialtyModel.description;
    this.isActive = specialtyModel.is_active;
  }

  /**
   * A static helper method to convert a list of Specialty model instances
   * into a list of DTOs.
   * @param {Array<Specialty>} specialtiesList - An array of Sequelize specialty models.
   * @returns {Array<SpecialtyOutputDto>} A list of formatted specialty objects.
   */
  static fromList(specialtiesList) {
    return specialtiesList.map(sp => new SpecialtyOutputDto(sp));
  }
}

module.exports = SpecialtyOutputDto;