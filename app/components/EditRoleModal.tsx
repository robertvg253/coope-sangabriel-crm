import { Form } from "react-router";
import { useState, useEffect } from "react";

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    role: string | null;
  };
}

export default function EditRoleModal({ isOpen, onClose, user }: EditRoleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is mounted before animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

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
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Editar Rol de Usuario</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <Form method="post" className="space-y-6">
              {/* Hidden field for user ID */}
              <input type="hidden" name="action" value="updateRole" />
              <input type="hidden" name="user_id" value={user.id} />

              {/* User Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Usuario
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed transition-colors duration-200"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="new_role" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Rol
                </label>
                <select
                  id="new_role"
                  name="new_role"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  defaultValue={user.role || ''}
                >
                  <option value="">Seleccionar rol</option>
                  <option value="administrador">Administrador</option>
                  <option value="editor">Editor</option>
                </select>
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-700">
                    <span className="font-medium">Rol actual:</span> {user.role ? (user.role === 'administrador' ? 'Administrador' : 'Editor') : 'Sin rol asignado'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Actualizando...
                    </div>
                  ) : (
                    "Actualizar Rol"
                  )}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
