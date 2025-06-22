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
        dentistId: dentistaMap['Dr. María González'],
        especialidadId: especialidadMap['Odontología General'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentistId: dentistaMap['Dr. María González'],
        especialidadId: especialidadMap['Estética Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dr. Carlos Rodríguez - Ortodoncia y Odontopediatría
      {
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        especialidadId: especialidadMap['Ortodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        especialidadId: especialidadMap['Odontopediatría'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dra. Ana Martínez - Endodoncia y Periodoncia
      {
        dentistId: dentistaMap['Dra. Ana Martínez'],
        especialidadId: especialidadMap['Endodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentistId: dentistaMap['Dra. Ana Martínez'],
        especialidadId: especialidadMap['Periodoncia'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dr. Luis Pérez - Cirugía Oral y Prótesis Dental
      {
        dentistId: dentistaMap['Dr. Luis Pérez'],
        especialidadId: especialidadMap['Cirugía Oral'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        dentistId: dentistaMap['Dr. Luis Pérez'],
        especialidadId: especialidadMap['Prótesis Dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('DentistSpecialties', null, {});
  }
};
