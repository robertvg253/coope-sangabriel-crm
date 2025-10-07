import { type LoaderFunctionArgs, redirect, useLoaderData } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";
import { useState } from "react";

// Función para cargar datos del registro de historial específico
export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await supabaseServer.auth.getSession();
  
  if (!session.data.session) {
    throw redirect("/");
  }

  try {
    // Obtener el registro específico del historial
    const { data: historialRecord, error: historialError } = await supabaseServer
      .from('agentes_historial')
      .select('*')
      .eq('id', params.id)
      .single();

    if (historialError) {
      console.error("Error loading historial record:", historialError);
      throw new Response("Registro de historial no encontrado", { status: 404 });
    }

    if (!historialRecord) {
      throw new Response("Registro de historial no encontrado", { status: 404 });
    }

    // Obtener información del agente
    const { data: agente, error: agenteError } = await supabaseServer
      .from('prompt_agentes')
      .select('desarrollo_id')
      .eq('id', historialRecord.agente_id)
      .single();

    if (agenteError) {
      console.error("Error loading agente:", agenteError);
    }

    // Obtener información del usuario que hizo el cambio
    let usuarioInfo = null;
    if (historialRecord.edited_by) {
      // Intentar obtener desde la tabla users personalizada
      const { data: usuario, error: usuarioError } = await supabaseServer
        .from('users')
        .select('id, email, user_metadata')
        .eq('id', historialRecord.edited_by)
        .single();

      if (usuarioError) {
        console.error("Error loading usuario from users table:", usuarioError);
        
        // Si no se encuentra en users, intentar desde auth.users
        const { data: authUsers, error: authError } = await supabaseServer.auth.admin.listUsers();
        if (!authError && authUsers.users) {
          const authUser = authUsers.users.find(user => user.id === historialRecord.edited_by);
          if (authUser) {
            usuarioInfo = {
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email,
              role: authUser.user_metadata?.role || 'Usuario'
            };
          }
        }
      } else if (usuario) {
        usuarioInfo = {
          email: usuario.email,
          full_name: usuario.user_metadata?.full_name,
          role: usuario.user_metadata?.role || 'Usuario'
        };
      }
    }

    console.log("✅ Historial record cargado exitosamente:", {
      id: historialRecord.id,
      version: historialRecord.version,
      agente: agente?.desarrollo_id,
      usuario: usuarioInfo?.email
    });

    return { 
      historialRecord, 
      agente: agente || { desarrollo_id: 'Agente desconocido' },
      usuarioInfo: usuarioInfo || { email: 'Usuario del Sistema', full_name: 'Usuario del Sistema', role: 'Sistema' }
    };
  } catch (error) {
    console.error("❌ Error en loader de historial detail:", error);
    throw error;
  }
}

// Definir los campos del historial con sus etiquetas
const historialFields = [
  { key: 'rol', label: 'Rol del Agente', icon: '🎭' },
  { key: 'camino_atencion', label: 'Camino de Atención', icon: '🛤️' },
  { key: 'uso_multimedia', label: 'Uso Multimedia', icon: '🎬' },
  { key: 'cierre', label: 'Cierre', icon: '🔚' },
  { key: 'flujo_atencion', label: 'Flujo de Atención', icon: '🔄' },
  { key: 'reglas_respuesta', label: 'Reglas de Respuesta', icon: '📋' },
  { key: 'faq', label: 'Preguntas Frecuentes', icon: '❓' },
  { key: 'informacion_proyecto', label: 'Información del Proyecto', icon: '📊' },
  { key: 'modelos', label: 'Modelos', icon: '🤖' },
  { key: 'tutoriales_credito', label: 'Tutoriales de Crédito', icon: '💳' },
];

// Componente para campos de solo lectura
interface ReadOnlyFieldProps {
  fieldKey: string;
  label: string;
  value: string;
  placeholder?: string;
}

function ReadOnlyField({ fieldKey, label, value, placeholder }: ReadOnlyFieldProps) {
  return (
    <div className="flex flex-col h-full">
      <label className="block text-xs font-medium text-custom-text-muted mb-2 flex-shrink-0">
        {label}
      </label>
      <div className="flex-1 bg-custom-card-bg border border-custom-border rounded-lg p-4 overflow-y-auto">
        {value ? (
          <div className="whitespace-pre-wrap text-custom-text-light text-sm leading-relaxed">
            {value}
          </div>
        ) : (
          <div className="text-custom-text-muted text-sm italic">
            {placeholder || "No hay contenido disponible para este campo"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistorialDetailPage() {
  const { historialRecord, agente, usuarioInfo } = useLoaderData<typeof loader>();
  const [selectedField, setSelectedField] = useState('rol');

  const selectedFieldData = historialFields.find(field => field.key === selectedField);
  const selectedValue = historialRecord?.[selectedField as keyof typeof historialRecord] || '';

  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-custom-card-bg border-b border-custom-border p-4 lg:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-custom-text-light mb-1">
              Historial - Versión {historialRecord.version}
            </h1>
            <p className="text-sm lg:text-base text-custom-text-muted">
              {agente.desarrollo_id} • Modificado por {usuarioInfo.email} • {new Date(historialRecord.updated_at).toLocaleString('es-ES')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/historial"
              className="px-4 py-2 bg-custom-card-bg-light text-custom-text-muted hover:bg-custom-hover-bg hover:text-custom-text-light rounded-lg transition-colors duration-200 text-sm lg:text-base"
            >
              ← Volver al Historial
            </a>
          </div>
        </div>
      </div>

      {/* Contenido Principal - Doble Columna */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Columna Izquierda - Navegación de Campos (25% en desktop, 100% en móvil) */}
        <div className="w-full lg:w-1/4 bg-custom-card-bg border-b lg:border-b-0 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-3 lg:p-4 border-b border-custom-border">
            <h2 className="text-xs font-semibold text-custom-text-light">
              Campos del Historial
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <nav>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-0">
                {historialFields.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => setSelectedField(field.key)}
                    className={`w-full text-left transition-all duration-200 ${
                      selectedField === field.key
                        ? 'bg-custom-card-bg-light text-custom-text-light p-2 lg:p-3'
                        : 'text-custom-text-muted hover:bg-custom-hover-bg hover:text-custom-text-light rounded-lg p-2 lg:p-3'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-xs mr-2 lg:mr-3">{field.icon}</span>
                      <span className="text-xs font-medium truncate">
                        {field.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Columna Derecha - Área de Contenido (75% en desktop, 100% en móvil) */}
        <div className="w-full lg:w-3/4 flex flex-col bg-custom-card-bg-light overflow-hidden">
          <div className="flex-shrink-0 p-3 lg:p-4">
            <h3 className="text-base lg:text-lg font-semibold text-custom-text-light flex items-center">
              <span className="mr-2 lg:mr-3">{selectedFieldData?.icon}</span>
              {selectedFieldData?.label}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-6">
            <ReadOnlyField
              fieldKey={selectedField}
              label={selectedFieldData?.label || ''}
              value={selectedValue || ''}
              placeholder={`Contenido de ${selectedFieldData?.label} en la versión ${historialRecord.version}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
