/**
 * Seeder para citas de ejemplo
 */

const { Appointment, User, GuestPatient, Availability, ServiceType } = require('../models');

// Estados posibles para las citas
const appointmentStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

// Notas de ejemplo para las citas
const sampleNotes = [
  'Primera consulta, paciente refiere dolor en muela superior derecha',
  'Control post-tratamiento, evolución favorable',
  'Paciente solicita información sobre blanqueamiento dental',
  'Revisión de rutina, sin molestias específicas',
  'Seguimiento de tratamiento ortodóntico',
  'Consulta por sensibilidad dental',
  'Evaluación para implante dental',
  'Control post-cirugía, cicatrización normal',
  'Paciente interesado en diseño de sonrisa',
  'Limpieza dental de rutina'
];

async function run() {
  try {
    // Verificar si ya existen citas
    const existingCount = await Appointment.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} citas. Saltando seeder de citas.`);
      return;
    }

    // Obtener datos necesarios
    const users = await User.findAll({ where: { role: 'user' } });
    const guestPatients = await GuestPatient.findAll();
    const availabilities = await Availability.findAll({
      where: { is_active: true },
      limit: 50 // Limitar para no crear demasiadas citas
    });
    const serviceTypes = await ServiceType.findAll();

    if (users.length === 0 || availabilities.length === 0 || serviceTypes.length === 0) {
      throw new Error('Faltan datos necesarios. Ejecuta primero los otros seeders.');
    }

    const appointments = [];
    let appointmentCounter = 0;

    // Crear citas para usuarios registrados
    for (let i = 0; i < Math.min(users.length * 3, 20); i++) {
      if (appointmentCounter >= availabilities.length) break;

      const user = users[Math.floor(Math.random() * users.length)];
      const availability = availabilities[appointmentCounter];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];

      appointments.push({
        user_id: user.id,
        guest_patient_id: null,
        availability_id: availability.id,
        service_type_id: serviceType.id,
        status: status,
        notes: sampleNotes[Math.floor(Math.random() * sampleNotes.length)]
      });

      appointmentCounter++;
    }

    // Crear citas para pacientes invitados
    for (let i = 0; i < Math.min(guestPatients.length * 2, 15); i++) {
      if (appointmentCounter >= availabilities.length) break;

      const guestPatient = guestPatients[Math.floor(Math.random() * guestPatients.length)];
      const availability = availabilities[appointmentCounter];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];

      appointments.push({
        user_id: null,
        guest_patient_id: guestPatient.id,
        availability_id: availability.id,
        service_type_id: serviceType.id,
        status: status,
        notes: sampleNotes[Math.floor(Math.random() * sampleNotes.length)]
      });

      appointmentCounter++;
    }

    // Crear las citas
    const createdAppointments = await Appointment.bulkCreate(appointments, {
      returning: true,
      ignoreDuplicates: true
    });

    // Actualizar disponibilidades ocupadas
    const availabilityIds = createdAppointments.map(apt => apt.availability_id);
    await Availability.update(
      { 
        is_active: false // Marcar como no disponible
      },
      { 
        where: { id: availabilityIds }
      }
    );

    console.log(`✅ Creadas ${createdAppointments.length} citas de ejemplo`);
    
    // Mostrar estadísticas por estado
    const statusCounts = createdAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} citas`);
    });

    // Mostrar distribución por tipo de paciente
    const userAppointments = createdAppointments.filter(apt => apt.user_id).length;
    const guestAppointments = createdAppointments.filter(apt => apt.guest_patient_id).length;
    
    console.log(`   - Usuarios registrados: ${userAppointments} citas`);
    console.log(`   - Pacientes invitados: ${guestAppointments} citas`);

  } catch (error) {
    console.error('❌ Error en seeder de citas:', error);
    throw error;
  }
}

module.exports = { run };
