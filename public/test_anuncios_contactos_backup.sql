-- Script de prueba para verificar el cruce de datos entre anuncios y contactos_backup
-- Este script reemplaza el anterior que usaba la tabla contactos

-- 1. Verificar estructura de la tabla anuncios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anuncios' 
AND table_schema = 'public';

-- 2. Verificar estructura de la tabla contactos_backup
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contactos_backup' 
AND table_schema = 'public';

-- 3. Verificar datos de anuncios
SELECT id_meta_ads, campaign_name, ad_set_name, ads_name 
FROM public.anuncios 
LIMIT 5;

-- 4. Verificar datos de contactos_backup con whatsapp_cloud_ad_source_id
SELECT whatsapp_cloud_ad_source_id, COUNT(*) as total_contactos
FROM public.contactos_backup 
WHERE whatsapp_cloud_ad_source_id IS NOT NULL
GROUP BY whatsapp_cloud_ad_source_id
ORDER BY total_contactos DESC
LIMIT 10;

-- 5. Consulta de cruce para verificar efectividad con contactos_backup
SELECT 
    a.id_meta_ads,
    a.campaign_name,
    a.ad_set_name,
    a.ads_name,
    COUNT(c.whatsapp_cloud_ad_source_id) as leads_count
FROM public.anuncios a
LEFT JOIN public.contactos_backup c ON c.whatsapp_cloud_ad_source_id = a.id_meta_ads
GROUP BY a.id_meta_ads, a.campaign_name, a.ad_set_name, a.ads_name
ORDER BY leads_count DESC;

-- 6. Probar la función get_anuncios_with_effectiveness
SELECT * FROM get_anuncios_with_effectiveness() LIMIT 10;

-- 7. Probar la función optimizada get_anuncios_with_effectiveness_optimized
SELECT * FROM get_anuncios_with_effectiveness_optimized() LIMIT 10;

-- 8. Comparar rendimiento entre ambas funciones
EXPLAIN ANALYZE SELECT * FROM get_anuncios_with_effectiveness();
EXPLAIN ANALYZE SELECT * FROM get_anuncios_with_effectiveness_optimized();

-- 9. Verificar total de contactos en contactos_backup
SELECT COUNT(*) as total_contactos FROM public.contactos_backup;
SELECT COUNT(*) as contactos_con_ad_source FROM public.contactos_backup WHERE whatsapp_cloud_ad_source_id IS NOT NULL;
