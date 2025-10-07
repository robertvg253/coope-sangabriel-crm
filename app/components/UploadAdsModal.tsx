import { Form } from "react-router";
import { useState, useEffect } from "react";

interface UploadAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadAdsModal({ isOpen, onClose }: UploadAdsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Reset form when closing
      setSelectedFile(null);
      setCampaignName('');
      setUploadProgress(0);
      setUploadStatus('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setCampaignName('');
      setUploadProgress(0);
      setUploadStatus('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Solo se permiten archivos CSV');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStatus('Subiendo archivo...');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate processing status changes
    setTimeout(() => setUploadStatus('Procesando datos...'), 1000);
    setTimeout(() => setUploadStatus('Guardando anuncios...'), 2000);
    setTimeout(() => setUploadStatus('Finalizando...'), 3000);
    
    // Complete the progress and close modal after successful submission
    setTimeout(() => {
      setUploadProgress(100);
      setUploadStatus('¡Completado!');
      
      // Auto-close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with transparent dark overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isVisible ? 'bg-black/30' : 'bg-transparent'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Panel with slide animation */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Subir Anuncios</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <Form id="upload-form" method="post" encType="multipart/form-data" onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Campaña *
                </label>
                <input
                  type="text"
                  id="campaignName"
                  name="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="Ej: Campaña Q4 2024"
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo CSV *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="csvFile" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                        <span>Seleccionar archivo</span>
                        <input
                          id="csvFile"
                          name="csvFile"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="sr-only"
                          required
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta aquí</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV hasta 10MB</p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Archivo seleccionado:</span> {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isSubmitting && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{uploadStatus}</span>
                    <span className="text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Formato del CSV</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Cuatro columnas: ID Meta Ads, Nombre, Estado, Campaign ID</li>
                  <li>• El archivo debe tener encabezado en la primera fila</li>
                  <li>• ID Meta Ads: Identificador único del anuncio en Meta</li>
                  <li>• Estado: ACTIVE, PAUSED, DELETED, etc.</li>
                  <li>• Máximo 10,000 registros por archivo</li>
                </ul>
                <div className="mt-2 p-2 bg-purple-100 rounded text-xs text-purple-800">
                  <strong>Ejemplo:</strong><br />
                  id_meta_ads,name,status,campaign_id<br />
                  123456789,Anuncio Principal,ACTIVE,987654321<br />
                  123456790,Anuncio Secundario,PAUSED,987654321<br />
                  123456791,Anuncio Test,DELETED,987654322
                </div>
              </div>

            </Form>
          </div>

          {/* Footer - Fixed */}
          <div className="flex-shrink-0 border-t border-gray-200 p-6 bg-white">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="upload-form"
                disabled={isSubmitting || !selectedFile || !campaignName}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  "Subir Anuncios"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
