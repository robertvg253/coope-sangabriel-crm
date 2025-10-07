// Función helper para manejar fechas de Supabase
export function formatDateForSupabase(dateString: string, isEndDate: boolean = false): string {
  try {
    console.log(`🔧 Formateando fecha: "${dateString}" (isEndDate: ${isEndDate})`);
    
    // Validar que la fecha no esté vacía
    if (!dateString || dateString.trim() === '') {
      console.error("❌ Fecha vacía recibida");
      return '';
    }
    
    // Si la fecha ya está en formato ISO completo, usarla directamente
    if (dateString.includes('T') && dateString.includes('Z')) {
      console.log("✅ Fecha ya en formato ISO, usando directamente");
      return dateString;
    }
    
    // Si es solo fecha (YYYY-MM-DD), convertir a ISO
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log("📅 Fecha en formato YYYY-MM-DD, convirtiendo a ISO");
      const date = new Date(dateString + 'T00:00:00.000Z'); // Forzar UTC
      
      if (isNaN(date.getTime())) {
        console.error("❌ Fecha inválida:", dateString);
        return '';
      }
      
      if (isEndDate) {
        // Para fecha de fin, usar el final del día en UTC
        date.setUTCHours(23, 59, 59, 999);
        console.log("🕐 Configurando como fecha de fin (23:59:59.999Z)");
      } else {
        // Para fecha de inicio, usar el inicio del día en UTC
        date.setUTCHours(0, 0, 0, 0);
        console.log("🕐 Configurando como fecha de inicio (00:00:00.000Z)");
      }
      
      const result = date.toISOString();
      console.log(`✅ Fecha formateada: "${result}"`);
      return result;
    }
    
    // Si tiene formato ISO pero sin Z, agregar Z
    if (dateString.includes('T') && !dateString.includes('Z')) {
      console.log("📅 Fecha ISO sin timezone, agregando Z");
      return dateString + 'Z';
    }
    
    // Intentar parsear como fecha general
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("❌ No se pudo parsear la fecha:", dateString);
      return '';
    }
    
    if (isEndDate) {
      date.setUTCHours(23, 59, 59, 999);
    } else {
      date.setUTCHours(0, 0, 0, 0);
    }
    
    const result = date.toISOString();
    console.log(`✅ Fecha parseada y formateada: "${result}"`);
    return result;
    
  } catch (error) {
    console.error("❌ Error formateando fecha:", error, "Fecha original:", dateString);
    return '';
  }
}

// Función para formatear fechas para mostrar en la UI
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Sin fecha';
  
  try {
    // Si es un timestamp o fecha ISO
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Si no es una fecha válida, intentar parsear como string
      return dateString;
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}
