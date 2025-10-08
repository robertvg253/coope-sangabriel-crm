-- Función para obtener anuncios con efectividad calculada
-- Esta función ejecuta el query SQL que calcula la efectividad real
-- basada en el conteo de contactos por anuncio desde contactos_backup
-- Optimizada para manejar grandes volúmenes de datos

CREATE OR REPLACE FUNCTION get_anuncios_with_effectiveness()
RETURNS TABLE (
  id_meta_ads text,
  campaign_name text,
  ad_set_name text,
  ads_name text,
  efectividad bigint
) 
LANGUAGE sql
AS $$
  SELECT
    a.id_meta_ads,
    a.campaign_name,
    a.ad_set_name,
    a.ads_name,
    COUNT(c.whatsapp_cloud_ad_source_id) AS efectividad
  FROM
    public.anuncios AS a
  LEFT JOIN
    public.contactos_backup AS c ON a.id_meta_ads = c.whatsapp_cloud_ad_source_id
  WHERE
    c.whatsapp_cloud_ad_source_id IS NOT NULL
  GROUP BY
    a.id_meta_ads,
    a.campaign_name,
    a.ad_set_name,
    a.ads_name
  ORDER BY
    efectividad DESC;
$$;

-- Función alternativa que usa una subconsulta para mejor rendimiento con grandes volúmenes
CREATE OR REPLACE FUNCTION get_anuncios_with_effectiveness_optimized()
RETURNS TABLE (
  id_meta_ads text,
  campaign_name text,
  ad_set_name text,
  ads_name text,
  efectividad bigint
) 
LANGUAGE sql
AS $$
  WITH contact_counts AS (
    SELECT 
      whatsapp_cloud_ad_source_id,
      COUNT(*) as contact_count
    FROM public.contactos_backup
    WHERE whatsapp_cloud_ad_source_id IS NOT NULL
    GROUP BY whatsapp_cloud_ad_source_id
  )
  SELECT
    a.id_meta_ads,
    a.campaign_name,
    a.ad_set_name,
    a.ads_name,
    COALESCE(cc.contact_count, 0) AS efectividad
  FROM
    public.anuncios AS a
  LEFT JOIN
    contact_counts AS cc ON a.id_meta_ads = cc.whatsapp_cloud_ad_source_id
  ORDER BY
    efectividad DESC;
$$;
