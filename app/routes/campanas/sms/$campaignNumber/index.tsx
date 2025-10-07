import { type LoaderFunctionArgs, useLoaderData, Link } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { redirect } from "react-router";

// Loader para obtener los detalles de una campaña específica
export async function loader({ request, params }: LoaderFunctionArgs) {
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

  const campaignNumber = params.campaignNumber;
  
  if (!campaignNumber) {
    throw redirect("/campanas/sms");
  }

  console.log("🔍 Cargando detalles de campaña:", campaignNumber);

  // Obtener los detalles del reporte de la campaña
  const { data: campaignReport, error: reportError } = await supabaseAdmin
    .from('sms_campaign_report')
    .select('*')
    .eq('campaign_number', campaignNumber)
    .single();

  if (reportError) {
    console.error("❌ Error al obtener reporte de campaña:", reportError);
    throw redirect("/campanas/sms");
  }

  // Obtener todos los números de teléfono de esta campaña
  const { data: phoneNumbers, error: phonesError } = await supabaseAdmin
    .from('sms_campaign')
    .select('*')
    .eq('campaign_number', campaignNumber)
    .order('phone_number', { ascending: true });

  if (phonesError) {
    console.error("❌ Error al obtener números de teléfono:", phonesError);
  }

  console.log("✅ Datos cargados:", {
    report: campaignReport,
    phoneCount: phoneNumbers?.length || 0
  });

  return {
    user: session.data.session.user,
    role: userRole?.role || 'editor',
    campaignReport,
    phoneNumbers: phoneNumbers || []
  };
}

export default function CampaignDetailPage() {
  const { campaignReport, phoneNumbers, role } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/campanas/sms"
              className="mr-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaignReport.campaign_number}</h1>
              <p className="text-gray-600">Detalles de la campaña SMS</p>
            </div>
          </div>
          <Link
            to="/campanas/sms"
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Volver a Lotes
          </Link>
        </div>
      </div>

      {/* Información de la Campaña */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Campaña</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">Número de Campaña</h3>
            <p className="text-lg font-semibold text-blue-700">{campaignReport.campaign_number}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900">Total de Registros</h3>
            <p className="text-lg font-semibold text-green-700">{campaignReport.total_records}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900">Fecha de Subida</h3>
            <p className="text-lg font-semibold text-orange-700">
              {new Date(campaignReport.uploaded_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        {campaignReport.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">Descripción</h3>
            <p className="text-gray-700">{campaignReport.description}</p>
          </div>
        )}
      </div>

      {/* Tabla de Números de Teléfono */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Números de Teléfono ({phoneNumbers.length})
          </h2>
        </div>
        
        {phoneNumbers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay números de teléfono</h3>
            <p className="mt-1 text-sm text-gray-500">Esta campaña no tiene números de teléfono registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número de Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {phoneNumbers.map((phone, index) => (
                  <tr key={phone.phone_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {phone.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Registrado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Mostrando {phoneNumbers.length} de {campaignReport.total_records} números de teléfono
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Enviar SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
