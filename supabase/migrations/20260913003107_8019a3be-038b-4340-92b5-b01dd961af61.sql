DROP POLICY IF EXISTS "affiliate_stores public read active" ON public.affiliate_stores;

CREATE POLICY "affiliate_stores staff read" ON public.affiliate_stores
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

REVOKE SELECT ON public.affiliate_stores FROM anon;

CREATE OR REPLACE VIEW public.affiliate_stores_public
WITH (security_invoker = off) AS
SELECT id, name, slug, site_url, network, category, city, logo_url, active, created_at
FROM public.affiliate_stores
WHERE active = true;

GRANT SELECT ON public.affiliate_stores_public TO anon, authenticated;
GRANT ALL ON public.affiliate_stores TO service_role;