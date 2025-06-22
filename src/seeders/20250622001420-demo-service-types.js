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
        duration_minutes: 30,
        is_active: true,
        especialidadId: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Limpieza Dental',
        description: 'Limpieza profesional, eliminación de sarro y pulido dental.',
        duration_minutes: 45,
        is_active: true,
        especialidadId: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Empaste Dental',
        description: 'Tratamiento de caries con resina o amalgama.',
        duration_minutes: 60,
        is_active: true,
        especialidadId: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ajuste de Brackets',
        description: 'Ajuste y activación de aparatos de ortodoncia.',
        duration_minutes: 30,
        is_active: true,
        especialidadId: especialidadMap['Ortodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Colocación de Brackets',
        description: 'Instalación inicial de aparatos de ortodoncia.',
        duration_minutes: 90,
        is_active: true,
        especialidadId: especialidadMap['Ortodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tratamiento de Conducto',
        description: 'Endodoncia completa de una pieza dental.',
        duration_minutes: 90,
        is_active: true,
        especialidadId: especialidadMap['Endodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Limpieza Profunda',
        description: 'Tratamiento periodontal para eliminar bacterias de las encías.',
        duration_minutes: 60,
        is_active: true,
        especialidadId: especialidadMap['Periodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Extracción Simple',
        description: 'Extracción de dientes sin complicaciones.',
        duration_minutes: 45,
        is_active: true,
        especialidadId: especialidadMap['Cirugía Oral'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Extracción Compleja',
        description: 'Extracción de dientes impactados o con complicaciones.',
        duration_minutes: 90,
        is_active: true,
        especialidadId: especialidadMap['Cirugía Oral'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Consulta Pediátrica',
        description: 'Revisión dental especializada para niños.',
        duration_minutes: 30,
        is_active: true,
        especialidadId: especialidadMap['Odontopediatría'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Blanqueamiento Dental',
        description: 'Tratamiento estético para aclarar el color de los dientes.',
        duration_minutes: 60,
        is_active: true,
        especialidadId: especialidadMap['Estética Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Colocación de Carillas',
        description: 'Instalación de carillas estéticas de porcelana.',
        duration_minutes: 120,
        is_active: true,
        especialidadId: especialidadMap['Estética Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Colocación de Corona',
        description: 'Instalación de corona dental de porcelana o metal.',
        duration_minutes: 90,
        is_active: true,
        especialidadId: especialidadMap['Prótesis Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ajuste de Prótesis',
        description: 'Ajuste y modificación de prótesis removibles.',
        duration_minutes: 30,
        is_active: true,
        especialidadId: especialidadMap['Prótesis Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('service_types', null, {});
  }
};
