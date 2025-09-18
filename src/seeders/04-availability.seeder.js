/**
 * Seeder para disponibilidades de dentistas
 */

const { Availability, User, Specialty } = require('../models');

// Función para generar fechas futuras
function getNextDays(days) {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Horarios típicos de trabajo
const workingHours = [
  { start_time: '08:00', end_time: '09:00' },
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' },
  { start_time: '11:00', end_time: '12:00' },
  { start_time: '14:00', end_time: '15:00' },
  { start_time: '15:00', end_time: '16:00' },
  { start_time: '16:00', end_time: '17:00' },
  { start_time: '17:00', end_time: '18:00' }
];

// Horarios de fin de semana (más limitados)
const weekendHours = [
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' },
  { start_time: '11:00', end_time: '12:00' },
  { start_time: '14:00', end_time: '15:00' },
  { start_time: '15:00', end_time: '16:00' }
];

async function run() {
  try {
    // Verificar si ya existen disponibilidades
    const existingCount = await Availability.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} disponibilidades. Saltando seeder.`);
      return;
    }

    // Obtener todos los dentistas y especialidades
    const dentists = await User.findAll({
      where: { role: 'dentist', status: 'active' }
    });
    
    const specialties = await Specialty.findAll();

    if (dentists.length === 0) {
      throw new Error('No se encontraron dentistas. Ejecuta primero el seeder de usuarios.');
    }

    // Generar fechas para los próximos 30 días
    const dates = getNextDays(30);
    const availabilities = [];

    // Crear disponibilidades para cada dentista
    for (const dentist of dentists) {
      for (const date of dates) {
        const dayOfWeek = new Date(date).getDay(); // 0 = Domingo, 6 = Sábado
        
        // Determinar si es fin de semana
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const hoursToUse = isWeekend ? weekendHours : workingHours;
        
        // Algunos dentistas no trabajan fines de semana
        if (isWeekend && Math.random() < 0.3) {
          continue; // 30% de probabilidad de no trabajar fin de semana
        }

        // Crear disponibilidades para cada hora del día
        for (const hour of hoursToUse) {
          // Agregar algo de variabilidad (no todos los dentistas trabajan todas las horas)
          if (Math.random() < 0.85) { // 85% de probabilidad de estar disponible
            // Asignar una especialidad aleatoria al dentista
            const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)];
            
            availabilities.push({
              dentist_id: dentist.id,
              specialty_id: randomSpecialty.id,
              date: date,
              start_time: hour.start_time,
              end_time: hour.end_time,
              is_active: true
            });
          }
        }
      }
    }

    // Crear disponibilidades en lotes para mejor rendimiento
    const batchSize = 500;
    let totalCreated = 0;

    for (let i = 0; i < availabilities.length; i += batchSize) {
      const batch = availabilities.slice(i, i + batchSize);
      const created = await Availability.bulkCreate(batch, {
        returning: false,
        ignoreDuplicates: true
      });
      totalCreated += batch.length;
    }

    console.log(`✅ Creadas ${totalCreated} disponibilidades para ${dentists.length} dentistas`);
    console.log(`   - Período: próximos 30 días`);
    console.log(`   - Horarios: 8:00-12:00 y 14:00-18:00 (lun-vie)`);
    console.log(`   - Horarios: 9:00-12:00 y 14:00-16:00 (fin de semana, limitado)`);

  } catch (error) {
    console.error('❌ Error en seeder de disponibilidades:', error);
    throw error;
  }
}

module.exports = { run };
