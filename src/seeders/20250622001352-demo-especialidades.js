'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('especialidades', [
      {
        name: 'Odontología General',
        description: 'Tratamientos básicos de salud bucal, limpiezas, empastes y revisiones generales.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ortodoncia',
        description: 'Corrección de la posición de los dientes y mandíbulas mediante brackets y alineadores.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Endodoncia',
        description: 'Tratamiento de conductos radiculares para salvar dientes con pulpa dañada.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Periodoncia',
        description: 'Tratamiento de enfermedades de las encías y tejidos de soporte dental.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cirugía Oral',
        description: 'Extracciones complejas, implantes dentales y cirugías de la boca.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Odontopediatría',
        description: 'Atención dental especializada para niños y adolescentes.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Estética Dental',
        description: 'Blanqueamiento, carillas, coronas estéticas y mejoras cosméticas.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Prótesis Dental',
        description: 'Diseño y colocación de prótesis removibles y fijas.',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('especialidades', null, {});
  }
};
