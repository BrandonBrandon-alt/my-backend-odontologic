'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Obtener usuarios dentistas
    const dentistas = await queryInterface.sequelize.query(
      'SELECT id, name FROM users WHERE role = \'dentist\' ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Crear mapeo de nombres a IDs
    const dentistaMap = {};
    dentistas.forEach(dent => {
      dentistaMap[dent.name] = dent.id;
    });

    await queryInterface.bulkInsert('disponibilidades', [
      // Dr. María González - Lunes a Viernes
      {
        day_of_week: 1, // Lunes
        start_time: '08:00',
        end_time: '17:00',
        is_active: true,
        dentistId: dentistaMap['Dr. María González'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 2, // Martes
        start_time: '08:00',
        end_time: '17:00',
        is_active: true,
        dentistId: dentistaMap['Dr. María González'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 3, // Miércoles
        start_time: '08:00',
        end_time: '17:00',
        is_active: true,
        dentistId: dentistaMap['Dr. María González'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 4, // Jueves
        start_time: '08:00',
        end_time: '17:00',
        is_active: true,
        dentistId: dentistaMap['Dr. María González'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 5, // Viernes
        start_time: '08:00',
        end_time: '17:00',
        is_active: true,
        dentistId: dentistaMap['Dr. María González'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dr. Carlos Rodríguez - Lunes a Sábado
      {
        day_of_week: 1, // Lunes
        start_time: '09:00',
        end_time: '18:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 2, // Martes
        start_time: '09:00',
        end_time: '18:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 3, // Miércoles
        start_time: '09:00',
        end_time: '18:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 4, // Jueves
        start_time: '09:00',
        end_time: '18:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 5, // Viernes
        start_time: '09:00',
        end_time: '18:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 6, // Sábado
        start_time: '09:00',
        end_time: '14:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Carlos Rodríguez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dra. Ana Martínez - Martes a Sábado
      {
        day_of_week: 2, // Martes
        start_time: '10:00',
        end_time: '19:00',
        is_active: true,
        dentistId: dentistaMap['Dra. Ana Martínez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 3, // Miércoles
        start_time: '10:00',
        end_time: '19:00',
        is_active: true,
        dentistId: dentistaMap['Dra. Ana Martínez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 4, // Jueves
        start_time: '10:00',
        end_time: '19:00',
        is_active: true,
        dentistId: dentistaMap['Dra. Ana Martínez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 5, // Viernes
        start_time: '10:00',
        end_time: '19:00',
        is_active: true,
        dentistId: dentistaMap['Dra. Ana Martínez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 6, // Sábado
        start_time: '10:00',
        end_time: '16:00',
        is_active: true,
        dentistId: dentistaMap['Dra. Ana Martínez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dr. Luis Pérez - Lunes a Viernes
      {
        day_of_week: 1, // Lunes
        start_time: '07:00',
        end_time: '16:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Luis Pérez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 2, // Martes
        start_time: '07:00',
        end_time: '16:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Luis Pérez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 3, // Miércoles
        start_time: '07:00',
        end_time: '16:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Luis Pérez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 4, // Jueves
        start_time: '07:00',
        end_time: '16:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Luis Pérez'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        day_of_week: 5, // Viernes
        start_time: '07:00',
        end_time: '16:00',
        is_active: true,
        dentistId: dentistaMap['Dr. Luis Pérez'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('disponibilidades', null, {});
  }
};
