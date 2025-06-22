'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero obtener las especialidades para usar sus IDs reales
    const especialidades = await queryInterface.sequelize.query(
      'SELECT id, name FROM especialidades ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Crear un mapeo de nombres a IDs
    const especialidadMap = {};
    especialidades.forEach(esp => {
      especialidadMap[esp.name] = esp.id;
    });

    await queryInterface.bulkInsert('service_types', [
      {
        name: 'Consulta General',
        description: 'Revisión completa de salud bucal, diagnóstico y plan de tratamiento.',
        duration: 30,
        is_active: true,
        especialidad_id: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Limpieza Dental',
        description: 'Limpieza profesional, eliminación de sarro y pulido dental.',
        duration: 45,
        is_active: true,
        especialidad_id: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Empaste Dental',
        description: 'Tratamiento de caries con resina o amalgama.',
        duration: 60,
        is_active: true,
        especialidad_id: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ajuste de Brackets',
        description: 'Ajuste y activación de aparatos de ortodoncia.',
        duration: 30,
        is_active: true,
        especialidad_id: especialidadMap['Ortodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Colocación de Brackets',
        description: 'Instalación inicial de aparatos de ortodoncia.',
        duration: 90,
        is_active: true,
        especialidad_id: especialidadMap['Ortodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tratamiento de Conducto',
        description: 'Endodoncia completa de una pieza dental.',
        duration: 90,
        is_active: true,
        especialidad_id: especialidadMap['Endodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Limpieza Profunda',
        description: 'Tratamiento periodontal para eliminar bacterias de las encías.',
        duration: 60,
        is_active: true,
        especialidad_id: especialidadMap['Periodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Extracción Simple',
        description: 'Extracción de dientes sin complicaciones.',
        duration: 45,
        is_active: true,
        especialidad_id: especialidadMap['Cirugía Oral'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Extracción Compleja',
        description: 'Extracción de dientes impactados o con complicaciones.',
        duration: 90,
        is_active: true,
        especialidad_id: especialidadMap['Cirugía Oral'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Consulta Pediátrica',
        description: 'Revisión dental especializada para niños.',
        duration: 30,
        is_active: true,
        especialidad_id: especialidadMap['Odontopediatría'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Blanqueamiento Dental',
        description: 'Tratamiento estético para aclarar el color de los dientes.',
        duration: 60,
        is_active: true,
        especialidad_id: especialidadMap['Estética Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Colocación de Carillas',
        description: 'Instalación de carillas estéticas de porcelana.',
        duration: 120,
        is_active: true,
        especialidad_id: especialidadMap['Estética Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Colocación de Corona',
        description: 'Instalación de corona dental de porcelana o metal.',
        duration: 90,
        is_active: true,
        especialidad_id: especialidadMap['Prótesis Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ajuste de Prótesis',
        description: 'Ajuste y modificación de prótesis removibles.',
        duration: 30,
        is_active: true,
        especialidad_id: especialidadMap['Prótesis Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('service_types', null, {});
  }
};
