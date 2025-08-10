/**
 * DTO de salida de Tipo de Servicio (ServiceTypeOutputDto).
 * - Formatea los datos del tipo de servicio para el cliente.
 * - Incluye la especialidad anidada si fue cargada en la consulta.
 */
const SpecialtyOutputDto = require("../specialty/specialty-output.dto");

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

    // Si la especialidad viene incluida, formatearla con su propio DTO
    if (serviceTypeModel.specialty) {
      this.specialty = new SpecialtyOutputDto(serviceTypeModel.specialty);
    }
  }

  /**
   * Convierte una lista de modelos ServiceType en una lista de DTOs.
   * @param {Array<ServiceType>} serviceTypesList
   * @returns {Array<ServiceTypeOutputDto>}
   */
  static fromList(serviceTypesList) {
    return serviceTypesList.map((st) => new ServiceTypeOutputDto(st));
  }
}

module.exports = ServiceTypeOutputDto;
