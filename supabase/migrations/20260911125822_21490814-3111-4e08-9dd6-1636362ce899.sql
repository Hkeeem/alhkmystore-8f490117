REVOKE SELECT ON public.affiliate_stores FROM anon;
REVOKE SELECT ON public.affiliate_stores FROM authenticated;

GRANT SELECT (
  id, name, slug, site_url, network, tracking_template, affiliate_param,
  category, city, logo_url, notes, active, created_by, created_at, updated_at
) ON public.affiliate_stores TO anon;

GRANT SELECT (
  id, name, slug, site_url, network, tracking_template, affiliate_param,
  category, city, logo_url, notes, active, created_by, created_at, updated_at
) ON public.affiliate_stores TO authenticated;

GRANT ALL ON public.affiliate_stores TO service_role;