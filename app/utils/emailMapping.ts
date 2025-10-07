import { supabaseAdmin } from "~/supabase/supabaseAdmin";

/**
 * Función para obtener el mapeo de correos electrónicos a nombres completos
 * @returns Objeto con correos como claves y nombres como valores
 */
export async function getEmailToNameMapping(): Promise<Record<string, string>> {
  try {
    console.log("🔄 Cargando mapeo de correos a nombres...");
    
    const { data, error } = await supabaseAdmin
      .from('user_email_mapping')
      .select('correo, nombre');

    if (error) {
      console.error("❌ Error al obtener mapeo de correos:", error);
      return {};
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No se encontraron datos en user_email_mapping");
      return {};
    }

    // Crear el mapeo de correo -> nombre
    const emailMapping: Record<string, string> = {};
    data.forEach(record => {
      if (record.correo && record.nombre) {
        emailMapping[record.correo] = record.nombre;
      }
    });

    console.log(`✅ Mapeo cargado: ${Object.keys(emailMapping).length} correos mapeados`);
    return emailMapping;

  } catch (error) {
    console.error("❌ Error en getEmailToNameMapping:", error);
    return {};
  }
}

/**
 * Función para convertir un correo electrónico a nombre usando el mapeo
 * @param email - Correo electrónico a convertir
 * @param emailMapping - Mapeo de correos a nombres
 * @returns Nombre completo o el correo original si no se encuentra
 */
export function convertEmailToName(email: string, emailMapping: Record<string, string>): string {
  if (!email) return email;
  
  // Buscar el correo en el mapeo
  const name = emailMapping[email];
  
  // Si se encuentra el nombre, devolverlo; si no, devolver el correo original
  return name || email;
}
