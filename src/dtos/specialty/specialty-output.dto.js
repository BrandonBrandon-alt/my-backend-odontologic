/**
 * DTO de salida de Especialidad (SpecialtyOutputDto).
 * Garantiza una estructura consistente y limpia para las respuestas del API.
 */
/**
 * Data Transfer Object for formatting specialty data sent to the client.
 * This ensures a consistent and clean structure for API responses.
 */
class SpecialtyOutputDto {
  constructor(specialtyModel) {
    this.id = specialtyModel.id;
    this.name = specialtyModel.name;
    this.description = specialtyModel.description;
    this.isActive = specialtyModel.is_active; // Convierte snake_case a camelCase
  }

  /**
   * Convierte una lista de modelos Specialty en una lista de DTOs.
   * @param {Array<Specialty>} specialtiesList - Arreglo de modelos Sequelize.
   * @returns {Array<SpecialtyOutputDto>} Lista formateada para respuesta.
   */
  static fromList(specialtiesList) {
    return specialtiesList.map((sp) => new SpecialtyOutputDto(sp));
  }
}

module.exports = SpecialtyOutputDto;
