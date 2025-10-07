import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { formatDateForSupabase } from '~/utils/date-helpers';
import { generateAndUploadPDF } from '~/utils/pdfStorage';

// Función para obtener datos de contactos con filtros
async function getContactsData(filters: any) {
  try {
    console.log("📋 Obteniendo datos de contactos con filtros:", filters);
    
    // Construir consulta sin paginación para obtener todos los datos
    let query = supabaseAdmin
      .from('contactos')
      .select('*', { count: 'exact' });
    
    // Aplicar los mismos filtros que en el loader
    if (filters.canal) {
      query = query.eq('source', filters.canal);
    }
    
    if (filters.usuarioAsignado) {
      query = query.eq('assigned_user', filters.usuarioAsignado);
    }
    
    // Aplicar filtros de fecha
    if (filters.fechaInicio) {
      const formattedStartDate = formatDateForSupabase(filters.fechaInicio, false);
      if (formattedStartDate) {
        query = query.gte('created_at', formattedStartDate);
      }
    }
    
    if (filters.fechaFin) {
      const formattedEndDate = formatDateForSupabase(filters.fechaFin, true);
      if (formattedEndDate) {
        query = query.lte('created_at', formattedEndDate);
      }
    }
    
    // Obtener todos los datos sin paginación
    const { data: contacts, error, count } = await query
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("❌ Error al obtener datos para PDF:", error);
      throw new Error(`Error al obtener datos: ${error.message}`);
    }
    
    const totalCount = count || 0;
    console.log("✅ Datos obtenidos para PDF:", totalCount, "contactos");
    
    // Calcular insights adicionales para el PDF con filtros aplicados
    console.log("📊 Calculando insights para PDF con filtros aplicados...");
    
    // 1. Contactos de campañas - CON FILTROS
    let campaignQuery = supabaseAdmin.from('contactos').select('*', { count: 'exact', head: true }).not('whatsapp_cloud_ad_source_id', 'is', null);
    if (filters.canal) campaignQuery = campaignQuery.eq('source', filters.canal);
    if (filters.usuarioAsignado) campaignQuery = campaignQuery.eq('assigned_user', filters.usuarioAsignado);
    if (filters.fechaInicio) {
      const formattedStartDate = formatDateForSupabase(filters.fechaInicio, false);
      if (formattedStartDate) campaignQuery = campaignQuery.gte('created_at', formattedStartDate);
    }
    if (filters.fechaFin) {
      const formattedEndDate = formatDateForSupabase(filters.fechaFin, true);
      if (formattedEndDate) campaignQuery = campaignQuery.lte('created_at', formattedEndDate);
    }
    const { count: campaignContactsCount } = await campaignQuery;
    
    // 2. Contactos sin asignar - CON FILTROS
    let unassignedQuery = supabaseAdmin.from('contactos').select('*', { count: 'exact', head: true }).or('assigned_user.is.null,assigned_user.eq.');
    if (filters.canal) unassignedQuery = unassignedQuery.eq('source', filters.canal);
    if (filters.usuarioAsignado) unassignedQuery = unassignedQuery.eq('assigned_user', filters.usuarioAsignado);
    if (filters.fechaInicio) {
      const formattedStartDate = formatDateForSupabase(filters.fechaInicio, false);
      if (formattedStartDate) unassignedQuery = unassignedQuery.gte('created_at', formattedStartDate);
    }
    if (filters.fechaFin) {
      const formattedEndDate = formatDateForSupabase(filters.fechaFin, true);
      if (formattedEndDate) unassignedQuery = unassignedQuery.lte('created_at', formattedEndDate);
    }
    const { count: unassignedContactsCount } = await unassignedQuery;
    
    console.log("📈 Insights para PDF:", {
      campaignContacts: campaignContactsCount || 0,
      unassignedContacts: unassignedContactsCount || 0
    });
    
    return { 
      contacts: contacts || [], 
      totalCount,
      campaignContacts: campaignContactsCount || 0,
      unassignedContacts: unassignedContactsCount || 0
    };
    
  } catch (error) {
    console.error("❌ Error en getContactsData:", error);
    throw error;
  }
}

// Loader para manejar GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log("📄 Loader: Iniciando exportación de PDF...");
    console.log("🔍 Request URL:", request.url);
    
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    if (action !== "export-pdf") {
      console.error("❌ Acción no válida en loader:", action);
      return new Response("Acción no válida", { status: 400 });
    }
    
    // Obtener los filtros de la URL
    const canal = url.searchParams.get('canal') || '';
    const usuarioAsignado = url.searchParams.get('usuarioAsignado') || '';
    const fechaInicio = url.searchParams.get('fechaInicio') || '';
    const fechaFin = url.searchParams.get('fechaFin') || '';
    
    const filters = { canal, usuarioAsignado, fechaInicio, fechaFin };
    console.log("📋 Filtros para exportación:", filters);
    
    // 1. Obtener datos de contactos
    const { contacts, totalCount, campaignContacts, unassignedContacts } = await getContactsData(filters);
    
    // Verificar que tenemos datos
    if (!contacts || contacts.length === 0) {
      console.log("⚠️ No hay contactos para generar PDF");
      console.warn("🔍 FILTROS APLICADOS:", filters);
      console.warn("💡 SUGERENCIA: Verifica que el rango de fechas en la base de datos coincida con los filtros aplicados");
      return new Response("No hay datos para exportar con los filtros aplicados", { status: 400 });
    }
    
    // 2. Generar PDF y subirlo a Supabase Storage
    const result = await generateAndUploadPDF(contacts, totalCount, filters, campaignContacts, unassignedContacts);
    
    if (!result.success) {
      console.error("❌ Error en generación/subida de PDF:", result.error);
      return new Response(result.error || "Error generando PDF", { status: 500 });
    }
    
    // 3. Redirigir al cliente a la URL de descarga
    console.log("✅ PDF generado y subido exitosamente, redirigiendo a:", result.downloadUrl);
    
    return Response.redirect(result.downloadUrl!, 302);
    
  } catch (error) {
    console.error("❌ Error en loader de exportación:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}

// Action para exportar PDF (usar el mismo código que el loader)
export async function action({ request }: ActionFunctionArgs) {
  // Redirigir al loader para manejar la lógica
  return await loader({ request });
}

// No necesitamos un componente por defecto ya que esta ruta solo maneja la action
export default function ExportPDFRoute() {
  return null;
}
