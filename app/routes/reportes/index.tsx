import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { redirect } from "react-router";
import { useState } from "react";
import PieChart from "~/components/PieChart";
import { getAllAgentData, getAllTagsData } from "~/utils/pagination";
import { getEmailToNameMapping, convertEmailToName } from "~/utils/emailMapping";

// Verificar autenticación y obtener reportes con lógica condicional
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await supabaseServer.auth.getSession();
  
  if (!session.data.session) {
    throw redirect("/");
  }

  // Obtener el rol del usuario
  const { data: userRole, error: roleError } = await supabaseServer
    .from('user_roles')
    .select('role')
    .eq('user_id', session.data.session.user.id)
    .single();

  if (roleError) {
    console.error("Error al obtener el rol del usuario:", roleError);
    throw redirect("/");
  }

  // Obtener parámetro de canal de la URL
  const url = new URL(request.url);
  const canal = url.searchParams.get('canal') || 'pymes';
  
  // Determinar la tabla de origen basada en el canal
  const dataTable = canal === 'digitales' ? 'canales_digitales_data' : 'pymes_data';
  
  console.log("📊 Canal seleccionado:", canal);
  console.log("📊 Tabla de datos:", dataTable);

  try {
    // 1. Cargar opciones para filtros usando paginación
    console.log("🔄 Cargando datos con paginación para tabla:", dataTable);
    
    const [agents, tags, reportTags, emailMapping] = await Promise.all([
      getAllAgentData(dataTable),
      getAllTagsData(dataTable),
      supabaseAdmin.from('report_tags_collection').select('tag_name'),
      getEmailToNameMapping()
    ]);

    // Procesar opciones únicas (convertir correos a nombres)
    const uniqueAgents = [...new Set(agents?.map(a => convertEmailToName(a.assigned_user, emailMapping)).filter(Boolean) || [])];
    const uniqueTags = [...new Set(tags?.map(t => t.tags).filter(Boolean) || [])];
    const reportTagNames = reportTags.data?.map(t => t.tag_name) || [];

    console.log("👥 Agentes únicos (nombres):", uniqueAgents.length);
    console.log("🏷️ Etiquetas únicas:", uniqueTags.length);
    console.log("📋 Etiquetas de reporte:", reportTagNames);

    // 2. REPORTE 1: Desempeño por Agente y Gráfico Público/Privado
    // Usar los datos ya cargados con paginación
    const agentPerformance = agents?.filter(record => record.assigned_user) || [];

    // Procesar datos de agentes (convertir correos a nombres)
    const agentStats = (agentPerformance || []).reduce((acc, record) => {
      const agentEmail = record.assigned_user;
      const agentName = convertEmailToName(agentEmail, emailMapping);
      
      if (!acc[agentName]) {
        acc[agentName] = { total: 0, publico: 0, privado: 0 };
      }
      
      acc[agentName].total++;
      
      if (record.tags && record.tags.includes('Gobierno')) {
        acc[agentName].publico++;
      }
      if (record.tags && record.tags.includes('Privado')) {
        acc[agentName].privado++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; publico: number; privado: number }>);

    // Convertir a array para la tabla
    const agentPerformanceTable = Object.entries(agentStats).map(([agent, stats]) => {
      const typedStats = stats as { total: number; publico: number; privado: number };
      return {
        agent,
        leads: typedStats.total,
        publico: typedStats.publico,
        privado: typedStats.privado,
        publicoPorcentaje: typedStats.total > 0 ? Math.round((typedStats.publico / typedStats.total) * 100) : 0,
        privadoPorcentaje: typedStats.total > 0 ? Math.round((typedStats.privado / typedStats.total) * 100) : 0
      };
    });

    // Calcular totales para el gráfico de dona
    const totalLeads = agentPerformanceTable.reduce((sum, agent) => sum + agent.leads, 0);
    const totalPublico = agentPerformanceTable.reduce((sum, agent) => sum + agent.publico, 0);
    const totalPrivado = agentPerformanceTable.reduce((sum, agent) => sum + agent.privado, 0);

    const pieChartData = [
      { label: 'Público', value: totalPublico, percentage: totalLeads > 0 ? Math.round((totalPublico / totalLeads) * 100) : 0 },
      { label: 'Privado', value: totalPrivado, percentage: totalLeads > 0 ? Math.round((totalPrivado / totalLeads) * 100) : 0 }
    ];

    console.log("📊 Reporte 1 - Agentes:", agentPerformanceTable.length);
    console.log("📊 Reporte 1 - Gráfico:", pieChartData);

    // 3. REPORTE 2: Por Etiqueta Global (Efectividad)
    // Usar los datos ya cargados con paginación
    const allRecords = tags || [];

    // Calcular efectividad por etiqueta
    const tagEffectiveness = reportTagNames.map(tagName => {
      const count = (allRecords || []).filter(record => 
        record.tags && record.tags.includes(tagName)
      ).length;
      
      return {
        tag: tagName,
        leads: count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
      };
    });

    console.log("📊 Reporte 2 - Etiquetas:", tagEffectiveness);

    // 4. REPORTE 3: Canales Digitales (Metas vs Ventas)
    // Datos simulados basados en la estructura de la imagen
    const digitalChannelsData = [
      { canal: 'Facebook Ads', meta: 150, ventas: 120, envios: 135, cumplimiento: 80 },
      { canal: 'Email', meta: 200, ventas: 180, envios: 195, cumplimiento: 90 },
      { canal: 'SMS', meta: 100, ventas: 85, envios: 95, cumplimiento: 85 },
      { canal: 'WhatsApp', meta: 80, ventas: 75, envios: 78, cumplimiento: 94 },
      { canal: 'LinkedIn', meta: 60, ventas: 45, envios: 50, cumplimiento: 75 },
      { canal: 'Google Ads', meta: 120, ventas: 110, envios: 115, cumplimiento: 92 }
    ];

    console.log("📊 Reporte 3 - Canales:", digitalChannelsData);

    return {
      user: session.data.session.user,
      role: userRole?.role || 'editor',
      canal,
      dataTable,
      // Opciones para filtros
      uniqueAgents,
      uniqueTags,
      reportTagNames,
      // Reporte 1: Desempeño por Agente
      agentPerformanceTable,
      pieChartData,
      // Reporte 2: Efectividad por Etiqueta
      tagEffectiveness,
      // Reporte 3: Canales Digitales
      digitalChannelsData
    };

  } catch (error) {
    console.error("❌ Error en loader de reportes:", error);
    return {
      user: session.data.session.user,
      role: userRole?.role || 'editor',
      canal: 'pymes',
      dataTable: 'pymes_data',
      uniqueAgents: [],
      uniqueTags: [],
      reportTagNames: [],
      agentPerformanceTable: [],
      pieChartData: [],
      tagEffectiveness: [],
      digitalChannelsData: []
    };
  }
}

export default function ReportesPage() {
  const { 
    canal, 
    dataTable, 
    uniqueAgents, 
    uniqueTags, 
    reportTagNames,
    agentPerformanceTable, 
    pieChartData, 
    tagEffectiveness, 
    digitalChannelsData 
  } = useLoaderData<typeof loader>();

  const [selectedCanal, setSelectedCanal] = useState(canal);

  const handleCanalChange = (newCanal: string) => {
    setSelectedCanal(newCanal);
    window.location.href = `/reportes?canal=${newCanal}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mr-4">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes de Desempeño</h1>
              <p className="text-gray-600">Análisis de efectividad y métricas de rendimiento</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {/* Filtro de Canal */}
            <div className="flex items-center space-x-2">
              <label htmlFor="canal-select" className="text-sm font-medium text-gray-700">
                Canal:
              </label>
              <select
                id="canal-select"
                value={selectedCanal}
                onChange={(e) => handleCanalChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pymes">Pymes</option>
                <option value="digitales">Digitales</option>
              </select>
            </div>
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Información de la Fuente de Datos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 text-sm">
            <strong>Fuente de datos:</strong> {dataTable} | <strong>Canal:</strong> {canal} | 
            <strong> Total de registros:</strong> {agentPerformanceTable.reduce((sum, agent) => sum + agent.leads, 0)}
          </p>
        </div>
      </div>

      {/* REPORTE 1: Desempeño por Agente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Reporte 1: Desempeño por Agente</h2>
        </div>
        <div className="p-6">
          {/* Tabla de Desempeño */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Público</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Privado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Públ. %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priv. %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentPerformanceTable.map((agent, index) => (
                  <tr key={agent.agent} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.publico}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.privado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {agent.publicoPorcentaje}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {agent.privadoPorcentaje}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfico de Dona */}
          <PieChart 
            data={pieChartData} 
            title="Distribución Público vs Privado" 
          />
        </div>
      </div>

    </div>
  );
}
