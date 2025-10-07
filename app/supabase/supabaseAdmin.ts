import { createClient } from '@supabase/supabase-js'


// Usar las variables correctas para el servidor
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE

console.log('🔧 Configuración supabaseAdmin:');
console.log('URL:', supabaseUrl ? '✅ Definida' : '❌ No definida');
console.log('Service Role Key:', supabaseServiceRoleKey ? '✅ Definida' : '❌ No definida');

// Validar que las variables existan para el servidor
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables faltantes:');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE:', supabaseServiceRoleKey ? 'Definida' : 'No definida');
  throw new Error('Faltan variables de entorno de Supabase del lado del servidor.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('✅ supabaseAdmin creado exitosamente');