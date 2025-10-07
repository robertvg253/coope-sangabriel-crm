import { supabaseAdmin } from "~/supabase/supabaseAdmin";

/**
 * Función para obtener todos los registros de una tabla usando paginación
 * @param tableName - Nombre de la tabla
 * @param selectColumns - Columnas a seleccionar
 * @param batchSize - Tamaño del lote (por defecto 1000)
 * @returns Array con todos los registros
 */
export async function getAllRecords(
  tableName: string,
  selectColumns: string = '*',
  batchSize: number = 1000
): Promise<any[]> {
  const allRecords: any[] = [];
  let offset = 0;
  let hasMore = true;

  console.log(`🔄 Iniciando carga de todos los registros de ${tableName}`);

  while (hasMore) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(selectColumns)
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error(`❌ Error al obtener registros de ${tableName}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords.push(...data);
        console.log(`📊 Lote ${Math.floor(offset / batchSize) + 1}: ${data.length} registros (Total: ${allRecords.length})`);
        
        // Si obtenemos menos registros que el batchSize, hemos llegado al final
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`❌ Error en paginación para ${tableName}:`, error);
      throw error;
    }
  }

  console.log(`✅ Carga completada: ${allRecords.length} registros totales de ${tableName}`);
  return allRecords;
}

/**
 * Función específica para obtener datos de agentes con paginación
 * @param tableName - Nombre de la tabla
 * @returns Array con todos los registros de agentes
 */
export async function getAllAgentData(tableName: string): Promise<any[]> {
  return getAllRecords(tableName, 'assigned_user, tags');
}

/**
 * Función específica para obtener todas las etiquetas con paginación
 * @param tableName - Nombre de la tabla
 * @returns Array con todos los registros de etiquetas
 */
export async function getAllTagsData(tableName: string): Promise<any[]> {
  return getAllRecords(tableName, 'tags');
}
