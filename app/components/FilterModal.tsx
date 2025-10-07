import React, { useState, useEffect } from 'react';
import UserFilter from './UserFilter';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    canal: string;
    usuarioAsignado: string;
    fechaInicio: string;
    fechaFin: string;
  }) => void;
  onClearFilters: () => void;
  currentFilters: {
    canal: string;
    usuarioAsignado: string;
    fechaInicio: string;
    fechaFin: string;
  };
  uniqueUsers: string[];
}

export default function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  onClearFilters,
  currentFilters,
  uniqueUsers
}: FilterModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);

  // Sincronizar filtros locales con los actuales
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  // Manejar animación de apertura
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleFilterChange = (filterName: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      canal: '',
      usuarioAsignado: '',
      fechaInicio: '',
      fechaFin: ''
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 pointer-events-none">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white w-full max-h-[80vh] transform transition-all duration-300 ease-out pointer-events-auto ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Filtros
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Canal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal
            </label>
            <select 
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={localFilters.canal}
              onChange={(e) => handleFilterChange('canal', e.target.value)}
            >
              <option value="">Todos los canales</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {/* Usuario Asignado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario Asignado
            </label>
            <UserFilter
              users={uniqueUsers}
              selectedUser={localFilters.usuarioAsignado}
              onUserChange={(user) => handleFilterChange('usuarioAsignado', user)}
              placeholder="Todos los usuarios"
            />
          </div>

          {/* Fecha de Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={localFilters.fechaInicio}
              max={localFilters.fechaFin || new Date().toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
            />
          </div>

          {/* Fecha de Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={localFilters.fechaFin}
              min={localFilters.fechaInicio || ''}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleClearFilters}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
