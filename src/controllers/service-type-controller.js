import React from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

function SelectorTipoServicio({ tiposServicio, onSelect, selected }) {
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarIcon className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona un Tipo de Servicio
        </h2>
        <p className="text-gray-600">
          Elige el servicio específico que necesitas
        </p>
      </div>

      {/* Grid mejorado para mostrar más columnas en pantallas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiposServicio.map((servicio) => (
          <motion.div
            key={servicio.id}
            whileHover={{ scale: 1.02 }} // Un ligero escalado al pasar el ratón
            whileTap={{ scale: 0.98 }}   // Un ligero "hundimiento" al hacer clic
            onClick={() => onSelect(servicio.id)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ease-in-out
              ${selected === servicio.id
                ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-xl' // Estilo más fuerte para la selección
                : 'border-gray-200 bg-white text-gray-800 hover:border-primary-300 hover:shadow-lg' // Estilo de hover mejorado
              }`}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2"> {/* Elimine el text-gray-900 directo, el color lo da el padre */}
                  {servicio.name}
                </h3>
                <p className="text-sm"> {/* Elimine el text-gray-600 directo */}
                  {servicio.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-sm"> {/* Elimine el text-gray-600 directo */}
                    <ClockIcon className="w-4 h-4" /> {/* Icono de reloj */}
                    <span>{formatDuration(servicio.duration)}</span>
                  </div>
                </div>
                {/* Bloque de precio eliminado (ya lo habías quitado) */}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duración estimada:</span>
                  <span className="font-medium">{formatDuration(servicio.duration)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {tiposServicio.length === 0 && (
        <div className="text-center py-8">
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay tipos de servicio disponibles</p>
        </div>
      )}
    </div>
  );
}

export default SelectorTipoServicio;
