import { createClient } from '@supabase/supabase-js'

// Verificar que las variables de entorno estén definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE

if (!supabaseUrl) {
  console.warn('⚠️ VITE_SUPABASE_URL no está definida en las variables de entorno')
  console.warn('📝 Crea un archivo .env con: VITE_SUPABASE_URL=https://tu-proyecto.supabase.co')
}

if (!supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY no está definida en las variables de entorno')
  console.warn('📝 Crea un archivo .env con: VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui')
}

if (!supabaseServiceRoleKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE no está definida en las variables de entorno')
  console.warn('📝 Crea un archivo .env con: VITE_SUPABASE_SERVICE_ROLE=tu_service_role_key_aqui')
}

// Usar valores por defecto si no están definidas (para desarrollo)
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalAnonKey = supabaseAnonKey || 'placeholder-anon-key'
const finalServiceRoleKey = supabaseServiceRoleKey || 'placeholder-service-role-key'

console.log('🔧 Configuración de Supabase Client:');
console.log('URL:', finalUrl !== 'https://placeholder.supabase.co' ? '✅ Definida' : '❌ Usando placeholder');
console.log('Anon Key:', finalAnonKey !== 'placeholder-anon-key' ? '✅ Definida' : '❌ Usando placeholder');
console.log('Service Role Key:', finalServiceRoleKey !== 'placeholder-service-role-key' ? '✅ Definida' : '❌ Usando placeholder');

// Crear y exportar la instancia del cliente de Supabase para autenticación
export const supabase = createClient(finalUrl, finalAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Crear y exportar la instancia del cliente de Supabase para operaciones de base de datos
export const supabaseAdmin = createClient(finalUrl, finalServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Exportar tipos útiles de Supabase
export type { User, Session } from '@supabase/supabase-js'
