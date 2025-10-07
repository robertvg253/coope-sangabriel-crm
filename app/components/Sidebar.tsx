import { Link, useLocation } from "react-router";
import { useState } from "react";

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const location = useLocation();
  const [isCampaignsOpen, setIsCampaignsOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleCampaigns = () => {
    setIsCampaignsOpen(!isCampaignsOpen);
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center p-6 border-b border-gray-200">
        <img 
          src="/cropped-csg-logo-1.png" 
          alt="Coope San Gabriel R.L." 
          className="w-12 h-12 mr-3 object-contain"
        />
        <div>
          <h2 className="text-lg font-bold text-gray-900">COOPE</h2>
          <p className="text-xs text-gray-600">SAN GABRIEL</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {/* Leads */}
        <Link
          to="/leads"
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive('/leads')
              ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Leads
        </Link>

        {/* Campañas - Dropdown */}
        <div>
          <button
            onClick={toggleCampaigns}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Campañas
            </div>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isCampaignsOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown content */}
          {isCampaignsOpen && (
            <div className="ml-6 mt-2 space-y-1">
              <Link
                to="/campanas/sms"
                className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  isActive('/campanas/sms')
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                SMS
              </Link>
              <Link
                to="/campanas/email"
                className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  isActive('/campanas/email')
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </Link>
            </div>
          )}
        </div>

        {/* Anuncios */}
        <Link
          to="/anuncios"
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive('/anuncios')
              ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
          </svg>
          Anuncios
        </Link>

        {/* Reportes */}
        <Link
          to="/reportes"
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive('/reportes')
              ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Reportes
        </Link>

        {/* Empleados - Solo visible para administradores */}
        {userRole === 'administrador' && (
          <Link
            to="/empleados"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
              isActive('/empleados')
                ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Empleados
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Panel de Control<br />
          COOPE SAN GABRIEL
        </div>
      </div>
    </div>
  );
}
