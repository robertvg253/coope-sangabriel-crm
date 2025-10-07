import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, useActionData, useNavigate } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { redirect } from "react-router";
import { useState, useEffect } from "react";
import UploadAdsModal from "~/components/UploadAdsModal";

// Verificar autenticación y obtener anuncios con efectividad
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

  // Intentar obtener anuncios con efectividad usando RPC primero
  let ads, adsError;
  
  try {
    const rpcResult = await supabaseAdmin.rpc('get_anuncios_with_effectiveness');
    ads = rpcResult.data;
    adsError = rpcResult.error;
  } catch (error) {
    console.log("🔄 RPC no disponible, usando consulta directa...");
    ads = null;
    adsError = { message: "RPC function not found" };
  }

  if (adsError || !ads) {
    console.log("🔄 Usando consulta directa como fallback...");
    
    // Fallback: consulta directa simple
    const { data: fallbackAds, error: fallbackError } = await supabaseAdmin
      .from('anuncios')
      .select('id_meta_ads, campaign_name, ad_set_name, ads_name')
      .order('campaign_name', { ascending: true })
      .order('ad_set_name', { ascending: true })
      .order('ads_name', { ascending: true });

    if (fallbackError) {
      console.error("Error en fallback:", fallbackError);
      return {
        user: session.data.session.user,
        role: userRole?.role || 'editor',
        ads: []
      };
    }

    // Obtener contactos para calcular efectividad
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contactos')
      .select('whatsapp_cloud_ad_source_id')
      .not('whatsapp_cloud_ad_source_id', 'is', null);

    if (contactsError) {
      console.error("Error al obtener contactos:", contactsError);
    }

    // Calcular efectividad manualmente
    const adsWithEffectiveness = (fallbackAds || []).map(ad => {
      const contactCount = (contacts || []).filter(contact => 
        contact.whatsapp_cloud_ad_source_id === ad.id_meta_ads
      ).length;

      return {
        id_meta_ads: ad.id_meta_ads,
        campaign_name: ad.campaign_name,
        ad_set_name: ad.ad_set_name,
        ads_name: ad.ads_name,
        efectividad: contactCount
      };
    });

    console.log("📊 Anuncios cargados con efectividad (fallback):", adsWithEffectiveness.length);
    console.log("📈 Total de contactos generados:", adsWithEffectiveness.reduce((sum: number, ad: any) => sum + ad.efectividad, 0));

    return {
      user: session.data.session.user,
      role: userRole?.role || 'editor',
      ads: adsWithEffectiveness
    };
  }

  console.log("📊 Anuncios obtenidos con efectividad real:", ads?.length || 0);
  console.log("📈 Total de contactos generados:", ads?.reduce((sum: number, ad: any) => sum + (ad.efectividad || 0), 0) || 0);

  return {
    user: session.data.session.user,
    role: userRole?.role || 'editor',
    ads: ads || []
  };
}

// Action para subir y procesar archivos CSV de anuncios
export async function action({ request }: ActionFunctionArgs) {
  const session = await supabaseServer.auth.getSession();
  
  if (!session.data.session) {
    throw redirect("/");
  }

  // Verificar rol del usuario
  const { data: userRole, error: roleError } = await supabaseServer
    .from('user_roles')
    .select('role')
    .eq('user_id', session.data.session.user.id)
    .single();

  if (roleError || !userRole?.role || (userRole.role !== 'administrador' && userRole.role !== 'editor')) {
    return {
      error: "No tienes permisos para subir archivos"
    };
  }

  const formData = await request.formData();
  const file = formData.get("csvFile") as File;
  const campaignName = formData.get("campaignName") as string;

  if (!file || !campaignName) {
    return {
      error: "Por favor, completa todos los campos"
    };
  }

  if (!file.name.endsWith('.csv')) {
    return {
      error: "Solo se permiten archivos CSV"
    };
  }

  try {
    console.log("📁 Iniciando procesamiento de CSV de anuncios:", file.name, "Tamaño:", file.size);
    
    // Leer el contenido del archivo CSV
    const csvContent = await file.text();
    console.log("📄 Contenido CSV leído, longitud:", csvContent.length);
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const totalRecords = lines.length - 1; // Excluir header
    
    console.log("📊 Líneas procesadas:", lines.length, "Registros de datos:", totalRecords);

    // Validar formato del CSV (debe tener 4 columnas: id_meta_ads, name, status, campaign_id)
    if (lines.length < 2) {
      console.error("❌ CSV inválido: menos de 2 líneas");
      return {
        error: "El archivo CSV debe tener al menos un encabezado y una fila de datos"
      };
    }

    // Verificar que todas las líneas tengan exactamente 4 columnas
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length !== 4) {
        console.error(`❌ Línea ${i + 1} tiene ${columns.length} columnas`);
        return {
          error: `Línea ${i + 1}: El archivo debe tener exactamente 4 columnas (id_meta_ads, name, status, campaign_id). Se encontraron ${columns.length} columnas.`
        };
      }
    }
    
    console.log("✅ Validación de formato CSV exitosa");

    // Procesar cada fila del CSV y insertar en anuncios
    const csvLines = lines.slice(1); // Excluir header
    console.log("📢 Procesando", csvLines.length, "anuncios");
    
    const adsRecords = csvLines.map((line, index) => {
      const [id_meta_ads, name, status, campaign_id] = line.split(',').map(col => col.trim());
      
      // Validar que los campos no estén vacíos
      if (!id_meta_ads || !name || !status || !campaign_id) {
        throw new Error(`Línea ${index + 2}: Todos los campos son requeridos`);
      }
      
      return {
        id_meta_ads,
        name,
        status,
        campaign_id
      };
    });

    console.log("📋 Registros preparados para inserción:", adsRecords.length);
    console.log("📋 Primeros 3 registros:", adsRecords.slice(0, 3));

    // Insertar registros en lote
    console.log("💾 Iniciando inserción masiva en anuncios...");
    
    const { data: insertedData, error: adsError } = await supabaseAdmin
      .from('anuncios')
      .insert(adsRecords)
      .select();

    if (adsError) {
      console.error("❌ Error al insertar anuncios:", adsError);
      return {
        error: `Error al procesar los anuncios: ${adsError.message}`
      };
    }
    
    console.log("✅ Total de anuncios insertados:", insertedData?.length || 0);

    return {
      success: `Campaña ${campaignName} procesada exitosamente. ${insertedData?.length || 0} anuncios guardados.`
    };

  } catch (error) {
    console.error("❌ Error en procesamiento de CSV:", error);
    
    // Si es un error de validación específico, mostrarlo
    if (error instanceof Error && error.message.includes('Línea')) {
      return {
        error: error.message
      };
    }
    
    return {
      error: `Error del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export default function AnunciosPage() {
  const { ads, role } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
  };

  // Real-time updates: Refresh page after successful upload
  useEffect(() => {
    if (actionData?.success) {
      // Close modal and refresh data
      setIsUploadModalOpen(false);
      // Small delay to show success message before refresh
      const timer = setTimeout(() => {
        navigate('.', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [actionData?.success, navigate]);

  const totalAds = ads.length;
  const totalEffectiveness = ads.reduce((sum: number, ad: any) => sum + (ad.efectividad || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mr-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Anuncios</h1>
              <p className="text-gray-600">Administra y supervisa las campañas publicitarias de Meta</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleUploadClick}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Subir CSV
            </button>
            <button 
              onClick={() => {
                // Create CSV content with new structure
                const csvContent = [
                  ['ID Meta', 'Nombre de la Campaña', 'Nombre del Grupo de Anuncio', 'Nombre del Anuncio', 'Efectividad'],
                  ...ads.map((ad: any) => [
                    ad.id_meta_ads,
                    ad.campaign_name || '',
                    ad.ad_set_name || '',
                    ad.ads_name,
                    ad.efectividad.toString()
                  ])
                ].map(row => row.join(',')).join('\n');

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `anuncios_jerarquia_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de Anuncios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Anuncios</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">Total de Anuncios</h3>
            <p className="text-2xl font-bold text-blue-700">{totalAds}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900">Campañas Únicas</h3>
            <p className="text-2xl font-bold text-green-700">
              {[...new Set(ads.map((ad: any) => ad.campaign_name).filter(Boolean))].length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900">Grupos de Anuncios</h3>
            <p className="text-2xl font-bold text-purple-700">
              {[...new Set(ads.map((ad: any) => ad.ad_set_name).filter(Boolean))].length}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900">Total de Contactos</h3>
            <p className="text-2xl font-bold text-orange-700">{totalEffectiveness}</p>
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {actionData?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{actionData.error}</p>
        </div>
      )}

      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{actionData.success}</p>
        </div>
      )}

      {/* Tabla de Anuncios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Anuncios por Jerarquía</h2>
        </div>
        
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay anuncios</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza subiendo tu primer archivo CSV de anuncios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Meta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre de la Campaña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre del Grupo de Anuncio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre del Anuncio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efectividad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad: any) => (
                  <tr key={ad.id_meta_ads} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ad.id_meta_ads}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ad.campaign_name || 'Sin campaña'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ad.ad_set_name || 'Sin grupo'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ad.ads_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ad.efectividad > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ad.efectividad} contactos
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Subida */}
      <UploadAdsModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}