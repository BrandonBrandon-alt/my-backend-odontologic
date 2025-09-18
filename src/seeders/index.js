/**
 * Seeder principal para poblar la base de datos
 * Ejecuta todos los seeders en el orden correcto
 */

const { sequelize } = require('../models');
const specialtySeeder = require('./01-specialty.seeder');
const serviceTypeSeeder = require('./02-service-type.seeder');
const userSeeder = require('./03-user.seeder');
const availabilitySeeder = require('./04-availability.seeder');
const appointmentSeeder = require('./05-appointment.seeder');
const guestPatientSeeder = require('./06-guest-patient.seeder');

/**
 * Ejecuta todos los seeders en orden
 */
async function runAllSeeders() {
  try {
    console.log('🌱 Iniciando proceso de seeders...');
    
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');

    // Ejecutar seeders en orden
    console.log('\n📊 Ejecutando seeders...');
    
    await specialtySeeder.run();
    console.log('✅ Especialidades creadas');
    
    await serviceTypeSeeder.run();
    console.log('✅ Tipos de servicio creados');
    
    await userSeeder.run();
    console.log('✅ Usuarios creados');
    
    await availabilitySeeder.run();
    console.log('✅ Disponibilidades creadas');
    
    await guestPatientSeeder.run();
    console.log('✅ Pacientes invitados creados');
    
    await appointmentSeeder.run();
    console.log('✅ Citas creadas');

    console.log('\n🎉 ¡Todos los seeders ejecutados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    throw error;
  }
}

/**
 * Limpia toda la base de datos y ejecuta los seeders
 */
async function resetAndSeed() {
  try {
    console.log('🔄 Reiniciando base de datos...');
    
    // Eliminar todas las tablas y recrearlas
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos reiniciada');
    
    // Ejecutar seeders
    await runAllSeeders();
    
  } catch (error) {
    console.error('❌ Error reiniciando base de datos:', error);
    throw error;
  }
}

module.exports = {
  runAllSeeders,
  resetAndSeed
};

// Si se ejecuta directamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === '--reset') {
    resetAndSeed()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runAllSeeders()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}
