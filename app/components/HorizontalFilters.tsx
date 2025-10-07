import { useSearchParams, useNavigate } from "react-router";
import UserFilter from "./UserFilter";

interface HorizontalFiltersProps {
  uniqueUsers: string[];
}

export default function HorizontalFilters({ uniqueUsers }: HorizontalFiltersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Función para manejar cambios de filtros
  const handleFilterChange = (filterName: string, value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Validación de fechas
    if (filterName === 'fechaInicio' && value) {
      const fechaFin = searchParams.get('fechaFin');
      if (fechaFin && new Date(value) > new Date(fechaFin)) {
        // Si la fecha de inicio es posterior a la fecha de fin, limpiar fecha de fin
        newSearchParams.delete('fechaFin');
      }
    }
    
    if (filterName === 'fechaFin' && value) {
      const fechaInicio = searchParams.get('fechaInicio');
      if (fechaInicio && new Date(value) < new Date(fechaInicio)) {
        // Si la fecha de fin es anterior a la fecha de inicio, limpiar fecha de inicio
        newSearchParams.delete('fechaInicio');
      }
    }
    
    if (value) {
      newSearchParams.set(filterName, value);
    } else {
      newSearchParams.delete(filterName);
    }
    newSearchParams.delete('page'); // Reset a página 1 cuando se cambia filtro
    navigate(`?${newSearchParams.toString()}`);
  };

  const handleClearFilters = () => {
    navigate('/leads');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {/* Canal */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal
          </label>
          <select 
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchParams.get('canal') || ''}
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
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usuario Asignado
          </label>
          <UserFilter
            users={uniqueUsers || []}
            selectedUser={searchParams.get('usuarioAsignado') || ''}
            onUserChange={(user) => handleFilterChange('usuarioAsignado', user)}
            placeholder="Todos los usuarios"
          />
        </div>

        {/* Fecha de Inicio */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Inicio
          </label>
          <input
            type="date"
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchParams.get('fechaInicio') || ''}
            max={searchParams.get('fechaFin') || new Date().toISOString().split('T')[0]}
            onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
          />
        </div>

        {/* Fecha de Fin */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Fin
          </label>
          <input
            type="date"
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchParams.get('fechaFin') || ''}
            min={searchParams.get('fechaInicio') || ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
          />
        </div>

        {/* Botón para limpiar filtros */}
        <div className="flex-shrink-0">
          <button
            onClick={handleClearFilters}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
