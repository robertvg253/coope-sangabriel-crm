-- Función para obtener anuncios con efectividad calculada
-- Esta función ejecuta el query SQL que calcula la efectividad real
-- basada en el conteo de contactos por anuncio

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
    public.contactos AS c ON a.id_meta_ads = c.whatsapp_cloud_ad_source_id
  GROUP BY
    a.id_meta_ads,
    a.campaign_name,
    a.ad_set_name,
    a.ads_name
  ORDER BY
    efectividad DESC;
$$;
