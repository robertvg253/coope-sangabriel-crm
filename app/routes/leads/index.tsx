import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, useNavigate, useSearchParams, redirect, Form } from "react-router";
import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { supabaseServer } from "~/supabase/supabaseServer";
import React, { useState } from "react";
import { formatDateForSupabase, formatDate } from "~/utils/date-helpers";
import ExportModal from "~/components/ExportModal";
import FilterModal from "~/components/FilterModal";
import HorizontalFilters from "~/components/HorizontalFilters";


// Función loader para obtener datos de contactos con paginación y filtros
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log("🔍 Cargando datos de contactos desde la base de datos...");
    
    // Verificar que supabaseAdmin esté definido
    if (!supabaseAdmin) {
      console.error("❌ supabaseAdmin no está definido");
      return { 
        contacts: [], 
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        error: 'Cliente de Supabase no configurado correctamente' 
      };
    }
    
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const canal = url.searchParams.get('canal') || '';
    const usuarioAsignado = url.searchParams.get('usuarioAsignado') || '';
    const fechaInicio = url.searchParams.get('fechaInicio') || '';
    const fechaFin = url.searchParams.get('fechaFin') || '';
    
    console.log("📋 Filtros aplicados:", { page, canal, usuarioAsignado, fechaInicio, fechaFin });
    
    // Configuración de paginación
    const itemsPerPage = 20;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    console.log("✅ supabaseAdmin está disponible, realizando consulta...");
    
    // Primero, hacer una consulta de prueba para ver el formato de las fechas
    if (fechaInicio || fechaFin) {
      console.log("🔍 Haciendo consulta de prueba para ver formato de fechas...");
      const { data: sampleData } = await supabaseAdmin
        .from('contactos')
        .select('id, created_at')
        .limit(3);
      
      if (sampleData && sampleData.length > 0) {
        console.log("📅 Formato de fechas en la base de datos:");
        sampleData.forEach((item, index) => {
          console.log(`  ${index + 1}. ID: ${item.id}, created_at: "${item.created_at}" (tipo: ${typeof item.created_at})`);
        });
      }
    }
    
    // Construir consulta base
    let query = supabaseAdmin
      .from('contactos')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (canal) {
      query = query.eq('source', canal);
    }
    
    if (usuarioAsignado) {
      query = query.eq('assigned_user', usuarioAsignado);
    }
    
    // Filtro de fechas - Validar y formatear correctamente
    if (fechaInicio || fechaFin) {
      console.log("📅 Procesando filtros de fecha...");
      
      // Validar rango de fechas
      if (fechaInicio && fechaFin) {
        const startDate = new Date(fechaInicio);
        const endDate = new Date(fechaFin);
        
        if (startDate > endDate) {
          console.error("❌ Error: Fecha de inicio es posterior a fecha de fin");
          return {
            contacts: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            error: 'La fecha de inicio no puede ser posterior a la fecha de fin'
          };
        }
        
        console.log("✅ Rango de fechas válido:", fechaInicio, "a", fechaFin);
      }
      
      // Aplicar filtro de fecha de inicio
      if (fechaInicio) {
        const formattedStartDate = formatDateForSupabase(fechaInicio, false);
        if (formattedStartDate) {
          console.log("🔍 Aplicando filtro fecha inicio:", fechaInicio, "->", formattedStartDate);
          query = query.gte('created_at', formattedStartDate);
        } else {
          console.error("❌ Error formateando fecha de inicio");
          return {
            contacts: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            error: 'Error en el formato de la fecha de inicio'
          };
        }
      }
      
      // Aplicar filtro de fecha de fin
      if (fechaFin) {
        const formattedEndDate = formatDateForSupabase(fechaFin, true);
        if (formattedEndDate) {
          console.log("🔍 Aplicando filtro fecha fin:", fechaFin, "->", formattedEndDate);
          query = query.lte('created_at', formattedEndDate);
        } else {
          console.error("❌ Error formateando fecha de fin");
          return {
            contacts: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            error: 'Error en el formato de la fecha de fin'
          };
        }
      }
    }
    
    // Aplicar paginación y ordenamiento
    console.log("🔍 Ejecutando consulta final con filtros aplicados...");
    console.log("📊 Parámetros de consulta:", {
      page,
      from,
      to,
      canal: canal || 'ninguno',
      usuarioAsignado: usuarioAsignado || 'ninguno',
      fechaInicio: fechaInicio || 'ninguna',
      fechaFin: fechaFin || 'ninguna'
    });
    
    const { data: contacts, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error("❌ Error al cargar contactos:", error);
      return { 
        contacts: [], 
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        error: error.message 
      };
    }
    
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    console.log("✅ Contactos cargados exitosamente:", contacts?.length || 0, "de", totalCount);
    
    // Calcular nuevos insights basados en los datos filtrados
    console.log("📊 Calculando insights adicionales con filtros aplicados...");
    
    // 1. Contactos de campañas (whatsapp_cloud_ad_source_id no es nulo) - CON FILTROS
    let campaignQuery = supabaseAdmin.from('contactos').select('*', { count: 'exact', head: true }).not('whatsapp_cloud_ad_source_id', 'is', null);
    if (canal) campaignQuery = campaignQuery.eq('source', canal);
    if (usuarioAsignado) campaignQuery = campaignQuery.eq('assigned_user', usuarioAsignado);
    if (fechaInicio) {
      const formattedStartDate = formatDateForSupabase(fechaInicio, false);
      if (formattedStartDate) campaignQuery = campaignQuery.gte('created_at', formattedStartDate);
    }
    if (fechaFin) {
      const formattedEndDate = formatDateForSupabase(fechaFin, true);
      if (formattedEndDate) campaignQuery = campaignQuery.lte('created_at', formattedEndDate);
    }
    const { count: campaignContactsCount } = await campaignQuery;
    
    // 2. Contactos sin asignar (assigned_user es nulo o vacío) - CON FILTROS
    let unassignedQuery = supabaseAdmin.from('contactos').select('*', { count: 'exact', head: true }).or('assigned_user.is.null,assigned_user.eq.');
    if (canal) unassignedQuery = unassignedQuery.eq('source', canal);
    if (usuarioAsignado) unassignedQuery = unassignedQuery.eq('assigned_user', usuarioAsignado);
    if (fechaInicio) {
      const formattedStartDate = formatDateForSupabase(fechaInicio, false);
      if (formattedStartDate) unassignedQuery = unassignedQuery.gte('created_at', formattedStartDate);
    }
    if (fechaFin) {
      const formattedEndDate = formatDateForSupabase(fechaFin, true);
      if (formattedEndDate) unassignedQuery = unassignedQuery.lte('created_at', formattedEndDate);
    }
    const { count: unassignedContactsCount } = await unassignedQuery;
    
    // 3. Obtener usuarios únicos para el filtro
    const { data: uniqueUsers } = await supabaseAdmin
      .from('contactos')
      .select('assigned_user')
      .not('assigned_user', 'is', null)
      .neq('assigned_user', '');
    
    // Procesar usuarios únicos
    const users = uniqueUsers 
      ? [...new Set(uniqueUsers.map(user => user.assigned_user).filter(Boolean))]
      : [];
    
    console.log("📈 Insights calculados:", {
      campaignContacts: campaignContactsCount || 0,
      unassignedContacts: unassignedContactsCount || 0,
      uniqueUsers: users.length
    });
    
    // Debug: Mostrar algunas fechas de ejemplo si hay datos
    if (contacts && contacts.length > 0) {
      console.log("📅 Ejemplos de fechas en los datos encontrados:");
      contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`  ${index + 1}. ID: ${contact.id}, created_at: ${contact.created_at}`);
      });
    } else if (fechaInicio || fechaFin) {
      console.warn("🔍 FILTROS DE FECHA APLICADOS:", { fechaInicio, fechaFin });
      console.warn("💡 SUGERENCIA: Verifica que el rango de fechas en la base de datos coincida con los filtros aplicados");
      // Si no hay datos pero se aplicaron filtros de fecha, hacer una consulta de prueba
      console.log("🔍 No se encontraron datos con los filtros aplicados. Haciendo consulta de prueba...");
      
      const { data: testData } = await supabaseAdmin
        .from('contactos')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (testData && testData.length > 0) {
        console.log("📅 Fechas disponibles en la base de datos (últimos 5 registros):");
        testData.forEach((item, index) => {
          console.log(`  ${index + 1}. ID: ${item.id}, created_at: ${item.created_at}`);
        });
        
        // Mostrar rango de fechas solicitado
        if (fechaInicio && fechaFin) {
          console.log(`🔍 Rango solicitado: ${fechaInicio} a ${fechaFin}`);
          console.log("💡 Sugerencia: Verifica que las fechas en la base de datos estén dentro del rango solicitado");
        }
      }
    }
    
    return { 
      contacts: contacts || [], 
      totalCount,
      currentPage: page,
      totalPages,
      error: null,
      // Nuevos insights
      campaignContacts: campaignContactsCount || 0,
      unassignedContacts: unassignedContactsCount || 0,
      // Usuarios únicos para el filtro
      uniqueUsers: users
    };
  } catch (error) {
    console.error("❌ Error en loader de dashboard:", error);
    return { 
      contacts: [], 
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Error desconocido',
      // Valores por defecto para nuevos insights
      campaignContacts: 0,
      unassignedContacts: 0,
      uniqueUsers: []
    };
  }
}

// Función action para manejar el logout
export async function action({ request }: ActionFunctionArgs) {
  try {
    console.log("🚪 Iniciando proceso de logout...");
    
    // Cerrar sesión usando el cliente de Supabase del servidor
    const { error } = await supabaseServer.auth.signOut();
    
    if (error) {
      console.error("❌ Error al cerrar sesión:", error);
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
    
    console.log("✅ Sesión cerrada exitosamente");
    
    // Redirigir a la página de login
    return redirect("/");
  } catch (error) {
    console.error("❌ Error en action de logout:", error);
    // Aún así redirigir al login en caso de error
    return redirect("/");
  }
}

export default function DashboardPage() {
  const { contacts, totalCount, currentPage, totalPages, error, campaignContacts, unassignedContacts, uniqueUsers } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estado para los modales
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Calcular métricas dinámicas
  const totalContacts = totalCount;
  const conversations = contacts.filter(contact => contact.source).length;
  // Nuevos insights desde el loader
  const totalCampaignContacts = campaignContacts;
  const totalUnassignedContacts = unassignedContacts;
  
  
  // Función para manejar paginación
  const handlePageChange = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', newPage.toString());
    navigate(`?${newSearchParams.toString()}`);
  };
  
  // Verificar si hay filtros activos para habilitar el botón Exportar PDF
  const hasActiveFilters = searchParams.get('canal') || 
                          searchParams.get('usuarioAsignado') || 
                          searchParams.get('fechaInicio') || 
                          searchParams.get('fechaFin');
  
  // Funciones para manejar el modal
  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };
  
  const handleExportCancel = () => {
    setIsExportModalOpen(false);
  };

  // Funciones para manejar el modal de filtros
  const handleFilterModalOpen = () => {
    setIsFilterModalOpen(true);
  };

  const handleFilterModalClose = () => {
    setIsFilterModalOpen(false);
  };

  const handleApplyFilters = (filters: {
    canal: string;
    usuarioAsignado: string;
    fechaInicio: string;
    fechaFin: string;
  }) => {
    const newSearchParams = new URLSearchParams();
    
    if (filters.canal) newSearchParams.set('canal', filters.canal);
    if (filters.usuarioAsignado) newSearchParams.set('usuarioAsignado', filters.usuarioAsignado);
    if (filters.fechaInicio) newSearchParams.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) newSearchParams.set('fechaFin', filters.fechaFin);
    
    navigate(`?${newSearchParams.toString()}`);
  };

  const handleClearFilters = () => {
    navigate('/leads');
  };

  return (
    <>
          
          {/* Header con botones */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              {hasActiveFilters && (
                <p className="text-sm text-orange-600 mt-1">
                  ✓ Filtros activos - {totalCount} contactos encontrados
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {/* Botón de filtros para móviles */}
              <button 
                onClick={handleFilterModalOpen}
                className="md:hidden bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                title="Filtrar datos"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filtrar
              </button>
              
              {/* Botón de exportar */}
              <button 
                onClick={handleExportClick}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                title="Exportar datos a PDF"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>

              {/* Botón de cerrar sesión */}
              <Form method="post" className="inline">
                <button 
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  title="Cerrar sesión"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                  <span className="sm:hidden">Salir</span>
                </button>
              </Form>
            </div>
        </div>

          {/* Filtros Horizontales */}
          <HorizontalFilters uniqueUsers={uniqueUsers || []} />

          {/* Sección de Insights (Cajitas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Cajita 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contactos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
            </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            </div>
        </div>
      </div>

            {/* Cajita 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{conversations}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

            {/* Cajita 3 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contactos de Campañas</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCampaignContacts}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
          </div>
        </div>

            {/* Cajita 4 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sin Asignar</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUnassignedContacts}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            </div>
          </div>
        </div>

          {/* Tabla de Datos */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Datos de Contactos</h3>
            </div>
            
            {/* Header de la tabla */}
            <div className="bg-gray-50 px-6 py-3">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                <div>Nombre</div>
                <div>Fuente</div>
                <div>Número de teléfono</div>
                <div>Campaña</div>
                <div>Creado en</div>
              </div>
            </div>
            
            {/* Contenido de la tabla con datos reales */}
            {error ? (
              <div className="px-6 py-8 text-center text-red-600">
                <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-900">Error al cargar los datos</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-600">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
                {hasActiveFilters ? (
                  <>
                    <p className="text-orange-600 font-medium">No se encontraron contactos con los filtros aplicados</p>
                    <p className="text-sm mt-2 text-gray-600">Intenta ajustar los filtros o ampliar el rango de fechas</p>
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700">
                        💡 <strong>Tip:</strong> Verifica que las fechas en la base de datos estén dentro del rango seleccionado
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-900">No hay contactos para mostrar</p>
                    <p className="text-sm text-gray-600">Los contactos aparecerán aquí una vez que se agreguen a la base de datos</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contacts.map((contact: any) => (
                  <div key={contact.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div className="text-gray-900 font-medium">
                        {contact.name || contact.nombre || 'Sin nombre'}
                      </div>
                      <div className="text-gray-600">
                        {contact.source || contact.fuente || 'Sin fuente'}
                      </div>
                      <div className="text-gray-600">
                        {contact.phone_number || contact.telefono || contact.phone || 'Sin teléfono'}
                      </div>
                      <div className="text-gray-600">
                        {contact.whatsapp_cloud_ad_source_id || 'Sin campaña'}
            </div>
                      <div className="text-gray-600">
                        {formatDate(contact.created_at)}
            </div>
          </div>
        </div>
                ))}
              </div>
            )}
        </div>
      </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalCount)} de {totalCount} contactos
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                  >
                    Anterior
                  </button>
                  
                  {/* Números de página */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors duration-200 ${
                            pageNum === currentPage
                              ? 'bg-orange-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
            </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                  >
                    Siguiente
                  </button>
        </div>
      </div>
            </div>
          )}
      
      {/* Modal de Exportación */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={handleExportCancel}
        totalCount={totalCount}
        searchParams={searchParams}
      />

      {/* Modal de Filtros para móviles */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={handleFilterModalClose}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        currentFilters={{
          canal: searchParams.get('canal') || '',
          usuarioAsignado: searchParams.get('usuarioAsignado') || '',
          fechaInicio: searchParams.get('fechaInicio') || '',
          fechaFin: searchParams.get('fechaFin') || ''
        }}
        uniqueUsers={uniqueUsers || []}
      />
      
    </>
  );
}
