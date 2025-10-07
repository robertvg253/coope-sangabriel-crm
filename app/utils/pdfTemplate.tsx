import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Definir estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#F9FAFB', // gray-50
    padding: 20,
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #EB8424', // orange-500
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 60,
  },
  logoBoxes: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  logoBox: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  logoBoxC: {
    backgroundColor: '#DC2626', // red-600
  },
  logoBoxS: {
    backgroundColor: '#EA580C', // orange-600
  },
  logoBoxG: {
    backgroundColor: '#F59E0B', // amber-500
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  logoText: {
    color: '#111827', // gray-900
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  date: {
    fontSize: 10,
    color: '#6B7280', // gray-500
    textAlign: 'right',
    marginTop: 10,
  },
  insights: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFFFFF', // white
    borderRadius: 8,
    border: '1 solid #E5E7EB', // gray-200
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 10,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightItem: {
    flex: 1,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#F9FAFB', // gray-50
    margin: 2,
    borderRadius: 4,
    border: '1 solid #E5E7EB', // gray-200
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EB8424', // orange-500
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: 8,
    color: '#4B5563', // gray-600
  },
  table: {
    marginTop: 20,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6', // gray-100
    padding: 4,
    borderRadius: 2,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: '#111827', // gray-900
    fontSize: 7,
    fontWeight: 'bold',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 3,
    borderBottom: '0.5 solid #E5E7EB', // gray-200
    minHeight: 12,
    backgroundColor: '#FFFFFF', // white
  },
  tableCell: {
    fontSize: 6,
    color: '#374151', // gray-700
    flex: 1,
    paddingRight: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#6B7280', // gray-500
    borderTop: '1 solid #E5E7EB', // gray-200
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 20,
    fontSize: 7,
    color: '#6B7280', // gray-500
  },
});

// Función para formatear fechas en el PDF
function formatDateForPDF(dateString: string | null): string {
  if (!dateString) return 'Sin fecha';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
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

// Componente principal del PDF
export function ContactsPDF({ 
  contacts, 
  totalCount, 
  filters,
  campaignContacts = 0,
  unassignedContacts = 0
}: {
  contacts: any[];
  totalCount: number;
  filters: {
    canal?: string;
    usuarioAsignado?: string;
    fechaInicio?: string;
    fechaFin?: string;
  };
  campaignContacts?: number;
  unassignedContacts?: number;
}) {
  // Calcular métricas
  const conversations = contacts.filter(contact => contact.source).length;
  // Usar los nuevos insights pasados como props
  const totalCampaignContacts = campaignContacts;
  const totalUnassignedContacts = unassignedContacts;

  // Generar texto de filtros aplicados
  const filtersText = [];
  if (filters.canal) filtersText.push(`Canal: ${filters.canal}`);
  if (filters.usuarioAsignado) filtersText.push(`Usuario: ${filters.usuarioAsignado}`);
  if (filters.fechaInicio) filtersText.push(`Desde: ${formatDateForPDF(filters.fechaInicio)}`);
  if (filters.fechaFin) filtersText.push(`Hasta: ${formatDateForPDF(filters.fechaFin)}`);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBoxes}>
              <View style={[styles.logoBox, styles.logoBoxC]}>
                <Text style={styles.logoLetter}>C</Text>
              </View>
              <View style={[styles.logoBox, styles.logoBoxS]}>
                <Text style={styles.logoLetter}>S</Text>
              </View>
              <View style={[styles.logoBox, styles.logoBoxG]}>
                <Text style={styles.logoLetter}>G</Text>
              </View>
            </View>
            <Text style={styles.logoText}>Coope San Gabriel R.L.</Text>
          </View>
          
          {/* Title and Info */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Reporte de Contactos</Text>
            <Text style={styles.subtitle}>
              {filtersText.length > 0 ? `Filtros aplicados: ${filtersText.join(', ')}` : 'Todos los contactos'}
            </Text>
          </View>
          
          {/* Date */}
          <View>
            <Text style={styles.date}>
              Generado el {new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insights}>
          <Text style={styles.insightsTitle}>Resumen Ejecutivo</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{totalCount.toLocaleString()}</Text>
              <Text style={styles.insightLabel}>Total Contactos</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{conversations.toLocaleString()}</Text>
              <Text style={styles.insightLabel}>Conversaciones</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{totalCampaignContacts.toLocaleString()}</Text>
              <Text style={styles.insightLabel}>Contactos de Campañas</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{totalUnassignedContacts.toLocaleString()}</Text>
              <Text style={styles.insightLabel}>Sin Asignar</Text>
            </View>
          </View>
        </View>

        {/* Tabla de Datos */}
        <View style={styles.table}>
          <Text style={styles.tableTitle}>Datos de Contactos</Text>
          
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Nombre</Text>
            <Text style={styles.tableHeaderText}>Fuente</Text>
            <Text style={styles.tableHeaderText}>Teléfono</Text>
            <Text style={styles.tableHeaderText}>Campaña</Text>
            <Text style={styles.tableHeaderText}>Creado</Text>
          </View>

          {/* Filas de datos */}
          {contacts.map((contact, index) => (
            <View key={contact.id || index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {contact.name || contact.nombre || 'Sin nombre'}
              </Text>
              <Text style={styles.tableCell}>
                {contact.source || contact.fuente || 'Sin fuente'}
              </Text>
              <Text style={styles.tableCell}>
                {contact.phone_number || contact.telefono || contact.phone || 'Sin teléfono'}
              </Text>
              <Text style={styles.tableCell}>
                {contact.whatsapp_cloud_ad_source_id || 'Sin campaña'}
              </Text>
              <Text style={styles.tableCell}>
                {formatDateForPDF(contact.created_at)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Este reporte fue generado automáticamente por el sistema de gestión de contactos
        </Text>
        
        {/* Número de página */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </Page>
    </Document>
  );
}
