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

    // Generar fechas para las próximas 4 semanas (más datos de prueba)
    const disponibilidades = [];
    const today = new Date();
    
    // Para cada dentista, crear disponibilidades para las próximas 4 semanas
    for (let day = 0; day < 28; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Dr. María González - Lunes a Viernes (1-5) - Odontología General y Estética
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Horario matutino para Odontología General
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. María González'],
          especialidad_id: especialidadMap['Odontología General'],
          date: dateString,
          start_time: '08:00:00',
          end_time: '12:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Horario vespertino para Estética Dental
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. María González'],
          especialidad_id: especialidadMap['Estética Dental'],
          date: dateString,
          start_time: '14:00:00',
          end_time: '18:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Dr. Carlos Rodríguez - Lunes a Sábado (1-6) - Ortodoncia y Odontopediatría
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const endTime = dayOfWeek === 6 ? '14:00:00' : '17:00:00';
        
        // Horario matutino para Ortodoncia
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Carlos Rodríguez'],
          especialidad_id: especialidadMap['Ortodoncia'],
          date: dateString,
          start_time: '09:00:00',
          end_time: endTime,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Horario vespertino para Odontopediatría (solo L-V)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          disponibilidades.push({
            dentist_id: dentistaMap['Dr. Carlos Rodríguez'],
            especialidad_id: especialidadMap['Odontopediatría'],
            date: dateString,
            start_time: '15:00:00',
            end_time: '19:00:00',
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      // Dra. Ana Martínez - Martes a Sábado (2-6) - Endodoncia y Periodoncia
      if (dayOfWeek >= 2 && dayOfWeek <= 6) {
        const endTime = dayOfWeek === 6 ? '16:00:00' : '19:00:00';
        
        // Horario matutino para Endodoncia
        disponibilidades.push({
          dentist_id: dentistaMap['Dra. Ana Martínez'],
          especialidad_id: especialidadMap['Endodoncia'],
          date: dateString,
          start_time: '10:00:00',
          end_time: endTime,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Horario vespertino para Periodoncia (solo M-V)
        if (dayOfWeek >= 2 && dayOfWeek <= 5) {
          disponibilidades.push({
            dentist_id: dentistaMap['Dra. Ana Martínez'],
            especialidad_id: especialidadMap['Periodoncia'],
            date: dateString,
            start_time: '14:00:00',
            end_time: '18:00:00',
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      // Dr. Luis Pérez - Lunes a Viernes (1-5) - Cirugía Oral y Prótesis
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Horario matutino para Cirugía Oral
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Luis Pérez'],
          especialidad_id: especialidadMap['Cirugía Oral'],
          date: dateString,
          start_time: '07:00:00',
          end_time: '12:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Horario vespertino para Prótesis Dental
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Luis Pérez'],
          especialidad_id: especialidadMap['Prótesis Dental'],
          date: dateString,
          start_time: '13:00:00',
          end_time: '18:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('disponibilidades', disponibilidades, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('disponibilidades', null, {});
  }
};
