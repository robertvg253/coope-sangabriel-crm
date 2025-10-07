import React, { useState } from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  searchParams: URLSearchParams;
}

export default function ExportModal({ isOpen, onClose, totalCount, searchParams }: ExportModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Efecto para manejar la animación de entrada y tecla Escape
  React.useEffect(() => {
    if (isOpen) {
      // Pequeño delay para que la animación sea visible
      const timer = setTimeout(() => setIsAnimating(true), 10);
      
      // Función para manejar tecla Escape
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      // Agregar listener para tecla Escape
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      {/* Modal */}
      <div className={`relative bg-white border border-gray-200 rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out pointer-events-auto ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Exportar a PDF
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
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres exportar los datos filtrados?
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">
                    {totalCount.toLocaleString()} contactos
                  </p>
                  <p className="text-sm text-gray-600">
                    Se generará un archivo PDF con todos los datos
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            
            {/* Botón para exportar PDF */}
            <button
              onClick={() => {
                console.log("🚀 Iniciando exportación de PDF...");
                onClose();
                
                // Crear URL con parámetros
                const params = new URLSearchParams();
                params.append('action', 'export-pdf');
                
                // Agregar filtros
                if (searchParams.get('canal')) {
                  params.append('canal', searchParams.get('canal')!);
                }
                if (searchParams.get('usuarioAsignado')) {
                  params.append('usuarioAsignado', searchParams.get('usuarioAsignado')!);
                }
                if (searchParams.get('fechaInicio')) {
                  params.append('fechaInicio', searchParams.get('fechaInicio')!);
                }
                if (searchParams.get('fechaFin')) {
                  params.append('fechaFin', searchParams.get('fechaFin')!);
                }
                
                // Crear URL de descarga
                const downloadUrl = `/export-pdf?${params.toString()}`;
                console.log("📤 URL de descarga:", downloadUrl);
                
                // Abrir en nueva ventana - el servidor redirigirá a la URL de Supabase
                window.open(downloadUrl, '_blank');
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
