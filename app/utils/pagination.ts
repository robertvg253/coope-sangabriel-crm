import { supabaseAdmin } from "~/supabase/supabaseAdmin";

/**
 * Obtiene todos los registros de una tabla usando paginación para superar el límite de 1000 de Supabase
 * @param tableName - Nombre de la tabla
 * @param selectFields - Campos a seleccionar (por defecto '*')
 * @param filters - Filtros adicionales opcionales
 * @returns Array con todos los registros
 */
export async function getAllRecordsWithPagination(
  tableName: string,
  selectFields: string = '*',
  filters?: {
    column?: string;
    operator?: string;
    value?: any;
  }
): Promise<any[]> {
  console.log(`📊 Obteniendo todos los registros de ${tableName}...`);
  
  let allRecords: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    let query = supabaseAdmin
      .from(tableName)
      .select(selectFields)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    // Aplicar filtros si se proporcionan
    if (filters) {
      if (filters.operator === 'not' && filters.value === null) {
        query = query.not(filters.column!, 'is', null);
      } else if (filters.operator && filters.value !== undefined) {
        query = query.filter(filters.column!, filters.operator, filters.value);
      }
    }
    
    const { data: recordsPage, error } = await query;
    
    if (error) {
      console.error(`Error al obtener registros de ${tableName} en página ${page}:`, error);
      break;
    }
    
    if (recordsPage && recordsPage.length > 0) {
      allRecords = [...allRecords, ...recordsPage];
      console.log(`📄 Página ${page + 1}: ${recordsPage.length} registros obtenidos. Total acumulado: ${allRecords.length}`);
      page++;
      
      // Si obtenemos menos de pageSize, es la última página
      if (recordsPage.length < pageSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log(`📈 Total de registros obtenidos de ${tableName}: ${allRecords.length}`);
  return allRecords;
}

/**
 * Obtiene todos los contactos de contactos_backup con paginación
 * @returns Array con todos los contactos
 */
export async function getAllContactsFromBackup(): Promise<any[]> {
  return getAllRecordsWithPagination(
    'contactos_backup',
    'whatsapp_cloud_ad_source_id',
    {
      column: 'whatsapp_cloud_ad_source_id',
      operator: 'not',
      value: null
    }
  );
}

/**
 * Obtiene todos los datos de agentes (assigned_user) de una tabla específica
 * @param tableName - Nombre de la tabla (ej: 'contactos', 'contactos_backup')
 * @returns Array con todos los registros de agentes
 */
export async function getAllAgentData(tableName: string): Promise<any[]> {
  return getAllRecordsWithPagination(
    tableName,
    'assigned_user, created_at, source, tags, name, phone_number'
  );
}

/**
 * Obtiene todos los datos de tags de una tabla específica
 * @param tableName - Nombre de la tabla (ej: 'contactos', 'contactos_backup')
 * @returns Array con todos los registros de tags
 */
export async function getAllTagsData(tableName: string): Promise<any[]> {
  return getAllRecordsWithPagination(
    tableName,
    'tags, assigned_user, created_at, source, name, phone_number'
  );
}