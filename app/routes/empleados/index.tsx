import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, useActionData } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { redirect } from "react-router";
import { Form } from "react-router";
import { useState } from "react";
import EditRoleModal from "~/components/EditRoleModal";

// Verificar autenticación y rol de administrador
export async function loader({ request }: LoaderFunctionArgs) {
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

  if (roleError || userRole?.role !== 'administrador') {
    // Si no es administrador, redirigir a leads
    throw redirect("/leads");
  }
  
  // Obtener todos los usuarios con sus roles
  const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error al obtener usuarios:", usersError);
    return {
      user: session.data.session.user,
      users: []
    };
  }

  // Obtener roles de todos los usuarios
  const userIds = users.users.map(u => u.id);
  const { data: userRoles, error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds);

  if (rolesError) {
    console.error("Error al obtener roles:", rolesError);
  }

  // Crear un mapa de roles para fácil acceso
  const rolesMap = new Map();
  if (userRoles) {
    userRoles.forEach(ur => {
      rolesMap.set(ur.user_id, ur.role);
    });
  }

  // Combinar usuarios con sus roles
  const usersWithRoles = users.users.map(user => ({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    role: rolesMap.get(user.id) || null
  }));

  return {
    user: session.data.session.user,
    role: userRole?.role,
    users: usersWithRoles
  };
}

// Action para crear nuevos usuarios y actualizar roles
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  // Verificar que el usuario actual es administrador
  const session = await supabaseServer.auth.getSession();
  if (!session.data.session) {
    throw redirect("/");
  }

  const { data: userRole, error: roleError } = await supabaseServer
    .from('user_roles')
    .select('role')
    .eq('user_id', session.data.session.user.id)
    .single();

  if (roleError || userRole?.role !== 'administrador') {
    return {
      error: "No tienes permisos para realizar esta acción"
    };
  }

  if (action === "updateRole") {
    // Actualizar rol de usuario existente
    const userId = formData.get("user_id") as string;
    const newRole = formData.get("new_role") as string;

    if (!userId || !newRole) {
      return {
        error: "Faltan datos requeridos para actualizar el rol"
      };
    }

    try {
      // UPSERT en la tabla user_roles
      const { error: upsertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole
        });

      if (upsertError) {
        return {
          error: `Error al actualizar rol: ${upsertError.message}`
        };
      }

      return {
        success: `Rol actualizado exitosamente a ${newRole}`
      };

    } catch (error) {
      console.error("Error al actualizar rol:", error);
      return {
        error: "Error del servidor. Intenta de nuevo más tarde."
      };
    }
  } else {
    // Crear nuevo usuario
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!email || !password || !role) {
      return {
        error: "Por favor, completa todos los campos"
      };
    }

    try {
      // Crear usuario con supabaseAdmin
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (userError) {
        return {
          error: `Error al crear usuario: ${userError.message}`
        };
      }

      if (userData.user) {
        // Insertar rol en la tabla user_roles
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userData.user.id,
            role: role
          });

        if (roleError) {
          return {
            error: `Error al asignar rol: ${roleError.message}`
          };
        }

        return {
          success: `Usuario ${email} creado exitosamente con rol ${role}`
        };
      }

      return {
        error: "Error inesperado al crear usuario"
      };

    } catch (error) {
      console.error("Error en creación de usuario:", error);
      return {
        error: "Error del servidor. Intenta de nuevo más tarde."
      };
    }
  }
}

export default function EmpleadosPage() {
  const { users, user, role } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    role: string | null;
  } | null>(null);

  const handleEditRole = (user: { id: string; email: string | undefined; role: string | null }) => {
    if (user.email) {
      setSelectedUser({
        id: user.id,
        email: user.email,
        role: user.role
      });
      setIsEditModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mr-4">
            <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
            <p className="text-gray-600">Administra y supervisa el personal de la organización</p>
          </div>
        </div>
      </div>

      {/* Formulario de Creación de Usuario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Nuevo Usuario</h2>
        
        <Form method="post" className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="usuario@empresa.com"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="••••••••"
            />
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Seleccionar rol</option>
              <option value="administrador">Administrador</option>
              <option value="editor">Editor</option>
            </select>
          </div>

          {/* Mensajes de error/éxito */}
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{actionData.error}</p>
            </div>
          )}

          {actionData?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-600 text-sm">{actionData.success}</p>
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creando usuario...
              </div>
            ) : (
              "Crear Usuario"
            )}
          </button>
        </Form>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Lista de Usuarios</h2>
        
        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'administrador' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'administrador' ? 'Administrador' : 'Editor'}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          No tiene rol
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {role === 'administrador' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRole(user)}
                            className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                            title="Editar rol del usuario"
                          >
                            Editar Rol
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                            title="Eliminar usuario"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin permisos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edición de Rol */}
      {selectedUser && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          user={selectedUser}
        />
      )}
    </div>
  );
}
