// src/dtos/serviceType.dto.js
const EspecialidadOutputDto = require('./especialidad-dto'); // Asegúrate de la ruta correcta

class ServiceTypeOutputDto {
  constructor(serviceTypeModel) {
    this.id = serviceTypeModel.id;
    this.name = serviceTypeModel.name;
    this.description = serviceTypeModel.description;
    this.duration = serviceTypeModel.duration;
    // this.price = serviceTypeModel.price; // Campo 'price' eliminado
    this.isActive = serviceTypeModel.is_active; // Incluir el estado activo

    // Si 'especialidad' está incluida en el modelo y no es nula, crea su DTO anidado.
    if (serviceTypeModel.especialidad) {
      this.especialidad = new EspecialidadOutputDto(serviceTypeModel.especialidad);
    }
  }

  static fromList(serviceTypesList) {
    return serviceTypesList.map(st => new ServiceTypeOutputDto(st));
  }
}

module.exports = ServiceTypeOutputDto;
