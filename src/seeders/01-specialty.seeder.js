/**
 * Seeder para especialidades odontológicas
 */

const { Specialty } = require('../models');

const specialties = [
  {
    name: 'Odontología General',
    description: 'Atención dental integral para toda la familia. Incluye limpiezas, revisiones preventivas, tratamiento de caries y cuidado básico de la salud bucal.',
    is_active: true
  },
  {
    name: 'Ortodoncia',
    description: 'Corrección de la posición de los dientes y la mordida mediante brackets, alineadores invisibles y otros aparatos ortodónticos.',
    is_active: true
  },
  {
    name: 'Endodoncia',
    description: 'Tratamiento de conductos radiculares para salvar dientes con infecciones o daños en la pulpa dental.',
    is_active: true
  },
  {
    name: 'Periodoncia',
    description: 'Tratamiento de enfermedades de las encías y estructuras que soportan los dientes, incluyendo gingivitis y periodontitis.',
    is_active: true
  },
  {
    name: 'Cirugía Oral',
    description: 'Procedimientos quirúrgicos en la boca, incluyendo extracciones, implantes dentales y cirugías de tejidos blandos.',
    is_active: true
  },
  {
    name: 'Odontopediatría',
    description: 'Atención dental especializada para bebés, niños y adolescentes, enfocada en la prevención y tratamiento temprano.',
    is_active: true
  },
  {
    name: 'Prostodoncia',
    description: 'Rehabilitación oral mediante prótesis dentales, coronas, puentes y restauraciones estéticas avanzadas.',
    is_active: true
  },
  {
    name: 'Estética Dental',
    description: 'Tratamientos para mejorar la apariencia de la sonrisa: blanqueamiento, carillas, diseño de sonrisa y estética facial.',
    is_active: true
  },
  {
    name: 'Implantología',
    description: 'Colocación de implantes dentales para reemplazar dientes perdidos de forma permanente y natural.',
    is_active: true
  },
  {
    name: 'Radiología Oral',
    description: 'Diagnóstico por imágenes especializadas: radiografías panorámicas, tomografías 3D y estudios radiológicos avanzados.',
    is_active: true
  }
];

async function run() {
  try {
    // Verificar si ya existen especialidades
    const existingCount = await Specialty.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} especialidades. Saltando seeder de especialidades.`);
      return;
    }

    // Crear especialidades
    const createdSpecialties = await Specialty.bulkCreate(specialties, {
      returning: true,
      ignoreDuplicates: true
    });

    console.log(`✅ Creadas ${createdSpecialties.length} especialidades`);
    
    // Mostrar especialidades creadas
    createdSpecialties.forEach(specialty => {
      console.log(`   - ${specialty.name}`);
    });

  } catch (error) {
    console.error('❌ Error en seeder de especialidades:', error);
    throw error;
  }
}

module.exports = { run };
