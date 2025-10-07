-- Script de prueba para verificar el cruce de datos entre anuncios y contactos

-- 1. Verificar estructura de la tabla anuncios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anuncios' 
AND table_schema = 'public';

-- 2. Verificar estructura de la tabla contactos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contactos' 
AND table_schema = 'public';

-- 3. Verificar datos de anuncios
SELECT id_meta_ads, name, status, campaign_id 
FROM public.anuncios 
LIMIT 5;

-- 4. Verificar datos de contactos con whatsapp_cloud_ad_source_id
SELECT whatsapp_cloud_ad_source_id, COUNT(*) as total_contactos
FROM public.contactos 
WHERE whatsapp_cloud_ad_source_id IS NOT NULL
GROUP BY whatsapp_cloud_ad_source_id
ORDER BY total_contactos DESC
LIMIT 10;

-- 5. Consulta de cruce para verificar efectividad
SELECT 
    a.id_meta_ads,
    a.name,
    a.status,
    COUNT(c.id) as leads_count
FROM public.anuncios a
LEFT JOIN public.contactos c ON c.whatsapp_cloud_ad_source_id = a.id_meta_ads
GROUP BY a.id_meta_ads, a.name, a.status
ORDER BY leads_count DESC;
