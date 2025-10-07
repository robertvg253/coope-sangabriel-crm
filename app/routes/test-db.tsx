import { type LoaderFunctionArgs } from "react-router";
import { supabaseServer } from "~/supabase/supabaseServer";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log("🧪 Iniciando prueba completa de conexión a la base de datos...");
    
    // 1. Probar conexión básica
    console.log("1️⃣ Probando conexión básica...");
    const { data: testData, error: testError } = await supabaseServer
      .from('prompt_agentes')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error("❌ Error en la prueba de conexión:", testError);
      return {
        success: false,
        error: testError.message,
        details: testError
      };
    }
    
    console.log("✅ Conexión exitosa. Datos encontrados:", testData);
    console.log("📊 Cantidad de registros:", testData?.length || 0);
    
    // 2. Probar consulta específica (como la del sidebar)
    console.log("2️⃣ Probando consulta específica del sidebar...");
    const { data: sidebarData, error: sidebarError } = await supabaseServer
      .from('prompt_agentes')
      .select('id, desarrollo_id')
      .order('updated_at', { ascending: false });
    
    if (sidebarError) {
      console.error("❌ Error en consulta del sidebar:", sidebarError);
    } else {
      console.log("✅ Consulta del sidebar exitosa:", sidebarData);
      console.log("📊 Agentes para sidebar:", sidebarData?.length || 0);
    }
    
    // 3. Probar contar registros
    console.log("3️⃣ Probando conteo de registros...");
    const { count, error: countError } = await supabaseServer
      .from('prompt_agentes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("❌ Error en conteo:", countError);
    } else {
      console.log("📊 Total de registros en la tabla:", count);
    }
    
    return {
      success: true,
      allData: testData,
      sidebarData: sidebarData,
      totalCount: count,
      allDataCount: testData?.length || 0,
      sidebarCount: sidebarData?.length || 0
    };
    
  } catch (error) {
    console.error("❌ Error inesperado en la prueba:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
}

export default function TestDbPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-4">Prueba de Base de Datos</h1>
      <p className="text-gray-300">
        Esta página es solo para testing. Revisa la consola del servidor para ver los resultados.
      </p>
    </div>
  );
}
