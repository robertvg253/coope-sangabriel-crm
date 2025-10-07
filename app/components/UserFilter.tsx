import React, { useState, useRef, useEffect } from 'react';

interface UserFilterProps {
  users: string[];
  selectedUser: string;
  onUserChange: (user: string) => void;
  placeholder?: string;
}

export default function UserFilter({ users, selectedUser, onUserChange, placeholder = "Todos los usuarios" }: UserFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar usuarios basado en el término de búsqueda
  const filteredUsers = users.filter(user =>
    user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserSelect = (user: string) => {
    onUserChange(user);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onUserChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:bg-gray-50 flex items-center justify-between"
      >
        <span className={selectedUser ? 'text-gray-900' : 'text-gray-500'}>
          {selectedUser || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* Clear Option */}
            <button
              onClick={handleClear}
              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {placeholder}
            </button>

            {/* User Options */}
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center ${
                    selectedUser === user
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {user}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No se encontraron usuarios
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
