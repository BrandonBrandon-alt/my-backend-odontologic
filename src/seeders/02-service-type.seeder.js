/**
 * Seeder para tipos de servicio por especialidad
 */

const { ServiceType, Specialty } = require('../models');

const serviceTypesBySpecialty = {
  'Odontología General': [
    {
      name: 'Consulta General',
      description: 'Revisión dental completa y diagnóstico',
      duration: 30,
      is_active: true
    },
    {
      name: 'Limpieza Dental (Profilaxis)',
      description: 'Limpieza profesional y remoción de placa bacteriana',
      duration: 45,
      is_active: true
    },
    {
      name: 'Obturación (Calza)',
      description: 'Tratamiento de caries con resina o amalgama',
      duration: 60,
      is_active: true
    },
    {
      name: 'Extracción Simple',
      description: 'Extracción de diente sin complicaciones',
      duration: 30,
      is_active: true
    }
  ],
  'Ortodoncia': [
    {
      name: 'Consulta Ortodóntica',
      description: 'Evaluación para tratamiento de ortodoncia',
      duration: 45,
      is_active: true
    },
    {
      name: 'Brackets Metálicos',
      description: 'Instalación de brackets tradicionales',
      duration: 120,
      is_active: true
    },
    {
      name: 'Brackets Estéticos',
      description: 'Brackets de cerámica o zafiro',
      duration: 120,
      is_active: true
    },
    {
      name: 'Alineadores Invisibles',
      description: 'Tratamiento con alineadores transparentes',
      duration: 60,
      is_active: true
    },
    {
      name: 'Control Ortodóntico',
      description: 'Revisión y ajuste mensual',
      duration: 30,
      is_active: true
    }
  ],
  'Endodoncia': [
    {
      name: 'Endodoncia Unirradicular',
      description: 'Tratamiento de conducto en diente de una raíz',
      duration: 90,
      is_active: true
    },
    {
      name: 'Endodoncia Multirradicular',
      description: 'Tratamiento de conducto en diente de múltiples raíces',
      duration: 120,
      is_active: true
    },
    {
      name: 'Retratamiento Endodóntico',
      description: 'Nuevo tratamiento en diente ya endodonciado',
      duration: 150,
      is_active: true
    }
  ],
  'Periodoncia': [
    {
      name: 'Evaluación Periodontal',
      description: 'Diagnóstico completo de encías y periodonto',
      duration: 45,
      is_active: true
    },
    {
      name: 'Raspaje y Alisado Radicular',
      description: 'Limpieza profunda por cuadrantes',
      duration: 60,
      is_active: true
    },
    {
      name: 'Cirugía Periodontal',
      description: 'Procedimiento quirúrgico para tratar periodontitis',
      duration: 120,
      is_active: true
    }
  ],
  'Cirugía Oral': [
    {
      name: 'Extracción Compleja',
      description: 'Extracción quirúrgica de diente impactado',
      duration: 90,
      is_active: true
    },
    {
      name: 'Extracción de Cordales',
      description: 'Remoción de muelas del juicio',
      duration: 60,
      is_active: true
    },
    {
      name: 'Biopsia Oral',
      description: 'Toma de muestra para análisis histopatológico',
      duration: 45,
      is_active: true
    }
  ],
  'Odontopediatría': [
    {
      name: 'Consulta Pediátrica',
      description: 'Revisión dental para niños',
      duration: 30,
      is_active: true
    },
    {
      name: 'Limpieza Pediátrica',
      description: 'Profilaxis dental para niños',
      duration: 30,
      is_active: true
    },
    {
      name: 'Aplicación de Flúor',
      description: 'Tratamiento preventivo con flúor',
      duration: 15,
      is_active: true
    },
    {
      name: 'Sellantes de Fosas',
      description: 'Protección preventiva de molares',
      duration: 30,
      is_active: true
    }
  ],
  'Prostodoncia': [
    {
      name: 'Corona Individual',
      description: 'Corona de porcelana o metal-porcelana',
      duration: 90,
      is_active: true
    },
    {
      name: 'Puente Fijo',
      description: 'Rehabilitación con puente de 3 unidades',
      duration: 120,
      is_active: true
    },
    {
      name: 'Prótesis Parcial Removible',
      description: 'Prótesis removible para varios dientes',
      duration: 60,
      is_active: true
    },
    {
      name: 'Prótesis Total',
      description: 'Dentadura completa superior o inferior',
      duration: 90,
      is_active: true
    }
  ],
  'Estética Dental': [
    {
      name: 'Blanqueamiento Dental',
      description: 'Blanqueamiento profesional en consultorio',
      duration: 90,
      is_active: true
    },
    {
      name: 'Carillas de Porcelana',
      description: 'Carillas estéticas por diente',
      duration: 120,
      is_active: true
    },
    {
      name: 'Diseño de Sonrisa',
      description: 'Planificación estética completa',
      duration: 60,
      is_active: true
    },
    {
      name: 'Resina Estética',
      description: 'Restauración estética con resina',
      duration: 60,
      is_active: true
    }
  ],
  'Implantología': [
    {
      name: 'Implante Dental Unitario',
      description: 'Colocación de implante individual',
      duration: 90,
      is_active: true
    },
    {
      name: 'Implantes Múltiples',
      description: 'Colocación de varios implantes',
      duration: 180,
      is_active: true
    },
    {
      name: 'Elevación de Seno Maxilar',
      description: 'Procedimiento para aumentar hueso',
      duration: 120,
      is_active: true
    }
  ],
  'Radiología Oral': [
    {
      name: 'Radiografía Panorámica',
      description: 'Radiografía completa de ambos maxilares',
      duration: 15,
      is_active: true
    },
    {
      name: 'Tomografía 3D (CBCT)',
      description: 'Tomografía computarizada de haz cónico',
      duration: 20,
      is_active: true
    },
    {
      name: 'Radiografías Periapicales',
      description: 'Radiografías de dientes específicos',
      duration: 10,
      is_active: true
    }
  ]
};

async function run() {
  try {
    // Verificar si ya existen tipos de servicio
    const existingCount = await ServiceType.count();
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} tipos de servicio. Saltando seeder.`);
      return;
    }

    // Obtener todas las especialidades
    const specialties = await Specialty.findAll();
    if (specialties.length === 0) {
      throw new Error('No se encontraron especialidades. Ejecuta primero el seeder de especialidades.');
    }

    let totalCreated = 0;

    // Crear tipos de servicio para cada especialidad
    for (const specialty of specialties) {
      const serviceTypes = serviceTypesBySpecialty[specialty.name];
      
      if (serviceTypes) {
        const serviceTypesWithSpecialty = serviceTypes.map(service => ({
          ...service,
          specialty_id: specialty.id
        }));

        const created = await ServiceType.bulkCreate(serviceTypesWithSpecialty, {
          returning: true,
          ignoreDuplicates: true
        });

        console.log(`   - ${specialty.name}: ${created.length} servicios`);
        totalCreated += created.length;
      }
    }

    console.log(`✅ Creados ${totalCreated} tipos de servicio en total`);

  } catch (error) {
    console.error('❌ Error en seeder de tipos de servicio:', error);
    throw error;
  }
}

module.exports = { run };
