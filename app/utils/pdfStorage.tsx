import { supabaseAdmin } from "~/supabase/supabaseAdmin";
import { pdf } from '@react-pdf/renderer';
import { ContactsPDF } from './pdfTemplate';

// Función para generar y subir PDF a Supabase Storage
export async function generateAndUploadPDF(
  contacts: any[], 
  totalCount: number, 
  filters: any,
  campaignContacts: number = 0,
  unassignedContacts: number = 0
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    console.log("🔧 Iniciando generación y subida de PDF...");
    console.log("📊 Datos recibidos:", { contactsCount: contacts.length, totalCount, filters });
    
    // 1. Generar el PDF
    const pdfBlob = await generatePDF(contacts, totalCount, filters, campaignContacts, unassignedContacts);
    console.log("✅ PDF generado exitosamente, tamaño:", pdfBlob.size, "bytes");
    
    // 2. Crear nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `contactos-${timestamp}.pdf`;
    console.log("📁 Nombre del archivo:", filename);
    
    // 3. Subir al bucket de Supabase
    console.log("📤 Subiendo PDF al bucket 'reportes_pdf'...");
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('reportes_pdf')
      .upload(filename, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false // No sobrescribir archivos existentes
      });
    
    if (uploadError) {
      console.error("❌ Error subiendo PDF:", uploadError);
      return { success: false, error: `Error subiendo PDF: ${uploadError.message}` };
    }
    
    console.log("✅ PDF subido exitosamente:", uploadData.path);
    
    // 4. Crear URL de descarga temporal (válida por 1 hora)
    console.log("🔗 Creando URL de descarga temporal...");
    const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
      .from('reportes_pdf')
      .createSignedUrl(filename, 3600); // 1 hora = 3600 segundos
    
    if (downloadError) {
      console.error("❌ Error creando URL de descarga:", downloadError);
      return { success: false, error: `Error creando URL de descarga: ${downloadError.message}` };
    }
    
    console.log("✅ URL de descarga creada:", downloadData.signedUrl);
    
    return { 
      success: true, 
      downloadUrl: downloadData.signedUrl 
    };
    
  } catch (error) {
    console.error("❌ Error en generateAndUploadPDF:", error);
    return { 
      success: false, 
      error: `Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
}

// Función para generar el PDF (reutilizable)
async function generatePDF(contacts: any[], totalCount: number, filters: any, campaignContacts: number = 0, unassignedContacts: number = 0) {
  try {
    console.log("🔧 Iniciando generación de PDF...");
    console.log("📊 Procesando", contacts.length, "contactos para el PDF");
    
    // Usar la plantilla existente ContactsPDF
    console.log("📄 Renderizando PDF con plantilla ContactsPDF...");
    const pdfBlob = await pdf(
      <ContactsPDF 
        contacts={contacts} 
        totalCount={totalCount} 
        filters={filters}
        campaignContacts={campaignContacts}
        unassignedContacts={unassignedContacts}
      />
    ).toBlob();
    
    console.log("✅ PDF generado exitosamente, tamaño:", pdfBlob.size, "bytes");
    
    return pdfBlob;
    
  } catch (error) {
    console.error("❌ Error en generatePDF:", error);
    throw error;
  }
}
