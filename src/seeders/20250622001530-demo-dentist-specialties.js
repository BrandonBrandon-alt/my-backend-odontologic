'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Obtener usuarios dentistas
    const dentistas = await queryInterface.sequelize.query(
      'SELECT id, name FROM users WHERE role = \'dentist\' ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Obtener especialidades
    const especialidades = await queryInterface.sequelize.query(
      'SELECT id, name FROM especialidades ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Crear mapeos
    const dentistaMap = {};
    dentistas.forEach(dent => {
      dentistaMap[dent.name] = dent.id;
    });

    const especialidadMap = {};
    especialidades.forEach(esp => {
      especialidadMap[esp.name] = esp.id;
    });

    await queryInterface.bulkInsert('DentistSpecialties', [
      // Dr. María González - Odontología General y Estética Dental
      {
        dentist_id: dentistaMap['Dr. María González'],
        especialidad_id: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentist_id: dentistaMap['Dr. María González'],
        especialidad_id: especialidadMap['Estética Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dr. Carlos Rodríguez - Ortodoncia y Odontopediatría
      {
        dentist_id: dentistaMap['Dr. Carlos Rodríguez'],
        especialidad_id: especialidadMap['Ortodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentist_id: dentistaMap['Dr. Carlos Rodríguez'],
        especialidad_id: especialidadMap['Odontopediatría'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dra. Ana Martínez - Endodoncia y Periodoncia
      {
        dentist_id: dentistaMap['Dra. Ana Martínez'],
        especialidad_id: especialidadMap['Endodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentist_id: dentistaMap['Dra. Ana Martínez'],
        especialidad_id: especialidadMap['Periodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dr. Luis Pérez - Cirugía Oral y Prótesis Dental
      {
        dentist_id: dentistaMap['Dr. Luis Pérez'],
        especialidad_id: especialidadMap['Cirugía Oral'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentist_id: dentistaMap['Dr. Luis Pérez'],
        especialidad_id: especialidadMap['Prótesis Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('DentistSpecialties', null, {});
  }
};
