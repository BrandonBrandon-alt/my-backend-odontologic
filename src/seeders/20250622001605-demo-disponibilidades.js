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

    // Generar fechas para las próximas 2 semanas
    const disponibilidades = [];
    const today = new Date();
    
    // Para cada dentista, crear disponibilidades para las próximas 2 semanas
    for (let day = 0; day < 14; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      
      // Dr. María González - Lunes a Viernes (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. María González'],
          especialidad_id: especialidadMap['Odontología General'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '08:00:00',
          end_time: '17:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // También agregar disponibilidad para Estética Dental
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. María González'],
          especialidad_id: especialidadMap['Estética Dental'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '08:00:00',
          end_time: '17:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Dr. Carlos Rodríguez - Lunes a Sábado (1-6)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const endTime = dayOfWeek === 6 ? '14:00:00' : '18:00:00';
        
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Carlos Rodríguez'],
          especialidad_id: especialidadMap['Ortodoncia'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '09:00:00',
          end_time: endTime,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // También agregar disponibilidad para Odontopediatría
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Carlos Rodríguez'],
          especialidad_id: especialidadMap['Odontopediatría'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '09:00:00',
          end_time: endTime,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Dra. Ana Martínez - Martes a Sábado (2-6)
      if (dayOfWeek >= 2 && dayOfWeek <= 6) {
        const endTime = dayOfWeek === 6 ? '16:00:00' : '19:00:00';
        
        disponibilidades.push({
          dentist_id: dentistaMap['Dra. Ana Martínez'],
          especialidad_id: especialidadMap['Endodoncia'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '10:00:00',
          end_time: endTime,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // También agregar disponibilidad para Periodoncia
        disponibilidades.push({
          dentist_id: dentistaMap['Dra. Ana Martínez'],
          especialidad_id: especialidadMap['Periodoncia'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '10:00:00',
          end_time: endTime,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Dr. Luis Pérez - Lunes a Viernes (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Luis Pérez'],
          especialidad_id: especialidadMap['Cirugía Oral'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '07:00:00',
          end_time: '16:00:00',
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // También agregar disponibilidad para Prótesis Dental
        disponibilidades.push({
          dentist_id: dentistaMap['Dr. Luis Pérez'],
          especialidad_id: especialidadMap['Prótesis Dental'],
          date: currentDate.toISOString().split('T')[0],
          start_time: '07:00:00',
          end_time: '16:00:00',
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
