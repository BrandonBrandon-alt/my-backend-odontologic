// especialidad.dto.js
class EspecialidadOutputDto {
  constructor(especialidadModel) {
    this.id = especialidadModel.id;
    this.name = especialidadModel.name;
    this.description = especialidadModel.description;
    this.isActive = especialidadModel.is_active; // Incluimos is_active aquí
  }

  // Si tienes una lista de especialidades, puedes tener un método estático
  static fromList(especialidadesList) {
    return especialidadesList.map(esp => new EspecialidadOutputDto(esp));
  }
}

module.exports = EspecialidadOutputDto;
