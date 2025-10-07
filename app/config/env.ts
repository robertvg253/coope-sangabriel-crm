// Configuración de variables de entorno
// Este archivo centraliza el manejo de variables de entorno para evitar problemas

export const env = {
  // Supabase Configuration
  supabase: {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE,
  }
};

// Función para validar la configuración
export function validateEnv() {
  const errors: string[] = [];
  
  if (!env.supabase.url) {
    errors.push('VITE_SUPABASE_URL o SUPABASE_URL no está definida');
  }
  
  if (!env.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY no está definida');
  }
  
  if (!env.supabase.serviceRoleKey) {
    errors.push('VITE_SUPABASE_SERVICE_ROLE o SUPABASE_SERVICE_ROLE no está definida');
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores de configuración:', errors);
    throw new Error(`Variables de entorno faltantes: ${errors.join(', ')}`);
  }
  
  console.log('✅ Configuración de variables de entorno validada correctamente');
  return true;
}

// Log de configuración (sin mostrar las keys completas por seguridad)
export function logConfig() {
  console.log('🔧 Configuración de Supabase:');
  console.log('URL:', env.supabase.url ? '✅ Definida' : '❌ No definida');
  console.log('Anon Key:', env.supabase.anonKey ? '✅ Definida' : '❌ No definida');
  console.log('Service Role Key:', env.supabase.serviceRoleKey ? '✅ Definida' : '❌ No definida');
}
