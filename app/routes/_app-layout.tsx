import { type LoaderFunctionArgs, redirect, Outlet, useLoaderData } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import Sidebar from "~/components/Sidebar";

// Función para verificar autenticación en todas las rutas del layout
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await supabaseServer.auth.getSession();
  
  // Si no está autenticado, redirigir al login
  if (!session.data.session) {
    throw redirect("/");
  }

  // Obtener el rol del usuario desde la tabla user_roles
  const { data: userRole, error: roleError } = await supabaseServer
    .from('user_roles')
    .select('role')
    .eq('user_id', session.data.session.user.id)
    .single();

  if (roleError) {
    console.error("Error al obtener el rol del usuario:", roleError);
    // Si no se puede obtener el rol, redirigir al login
    throw redirect("/");
  }

  console.log("✅ Usuario autenticado:", session.data.session.user.email, "Rol:", userRole?.role);
  
  return {
    user: session.data.session.user,
    role: userRole?.role || 'editor' // Default a editor si no se encuentra el rol
  };
}

export default function AppLayout() {
  const { user, role } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout de dos columnas */}
      <div className="flex h-screen">
        
        {/* Columna izquierda - Sidebar (20%) - FIXED - Hidden on mobile */}
        <div className="hidden md:block w-1/5 fixed left-0 top-0 h-full overflow-y-auto">
          <Sidebar userRole={role} />
        </div>

        {/* Columna derecha - Contenido Principal (80% desktop, 100% mobile) */}
        <div className="w-full md:w-4/5 bg-gray-50 p-6 md:ml-[20%] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
