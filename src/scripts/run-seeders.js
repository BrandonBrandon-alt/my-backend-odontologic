#!/usr/bin/env node

/**
 * Script para ejecutar seeders desde línea de comandos
 * 
 * Uso:
 * node scripts/run-seeders.js              # Ejecutar todos los seeders
 * node scripts/run-seeders.js --reset      # Reiniciar BD y ejecutar seeders
 * node scripts/run-seeders.js --help       # Mostrar ayuda
 */

const path = require('path');
const { runAllSeeders, resetAndSeed } = require('../seeders');

function showHelp() {
  console.log(`
🌱 Script de Seeders - Sistema Odontológico

Uso:
  node scripts/run-seeders.js [opciones]

Opciones:
  --reset     Reinicia la base de datos y ejecuta todos los seeders
  --help      Muestra esta ayuda

Ejemplos:
  node scripts/run-seeders.js              # Ejecutar seeders normalmente
  node scripts/run-seeders.js --reset      # Reiniciar BD completamente

⚠️  ADVERTENCIA: --reset eliminará TODOS los datos existentes
  `);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  try {
    console.log('🌱 Sistema de Seeders - Clínica Odontológica');
    console.log('=' .repeat(50));

    if (args.includes('--reset')) {
      console.log('⚠️  MODO RESET: Se eliminarán todos los datos existentes');
      console.log('Presiona Ctrl+C en los próximos 5 segundos para cancelar...');
      
      // Esperar 5 segundos antes de continuar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await resetAndSeed();
    } else {
      await runAllSeeders();
    }

    console.log('\n🎉 ¡Proceso completado exitosamente!');
    console.log('\n📋 Datos creados:');
    console.log('   • Especialidades odontológicas');
    console.log('   • Tipos de servicio por especialidad');
    console.log('   • Usuarios (admin, dentistas, pacientes)');
    console.log('   • Disponibilidades de dentistas');
    console.log('   • Pacientes invitados');
    console.log('   • Citas de ejemplo');
    
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   Admin: admin@clinica.com / admin123');
    console.log('   Dentista: carlos.rodriguez@clinica.com / dentist123');
    console.log('   Paciente: juan.perez@email.com / user123');

  } catch (error) {
    console.error('\n❌ Error ejecutando seeders:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
