-- 1) Gate buyer contact details behind verified advertisers ------------------
CREATE OR REPLACE FUNCTION public.is_verified_advertiser(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(_user_id IS NOT NULL AND (
    public.is_staff(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.owner_id = _user_id AND m.status = 'verified'
    )
  ), false);
$$;

REVOKE ALL ON FUNCTION public.is_verified_advertiser(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_advertiser(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.match_buyers_for_property(p_listing_id uuid)
RETURNS TABLE(id uuid, full_name text, phone text, city text, district text, property_type text, purpose text, max_price numeric, min_bedrooms smallint, features text[], required_services text[], match_score integer, is_demo boolean, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH caller AS (
    SELECT public.is_verified_advertiser(auth.uid()) AS verified
  ), owned_listing AS (
    SELECT l.* FROM public.property_listings l
    WHERE l.id = p_listing_id AND l.owner_id = auth.uid() AND l.status = 'active'
  ), scored AS (
    SELECT b.*, LEAST(100, GREATEST(0, ROUND(
      35 +
      CASE WHEN lower(trim(b.district)) = lower(trim(l.district)) THEN 20 ELSE 7 END +
      CASE WHEN lower(trim(b.property_type)) = lower(trim(l.property_type)) THEN 15 ELSE 0 END +
      CASE WHEN l.price <= b.max_price THEN 15
           WHEN l.price <= b.max_price * 1.10 THEN 8
           WHEN l.price <= b.max_price * 1.20 THEN 3 ELSE 0 END +
      CASE WHEN l.bedrooms >= b.min_bedrooms THEN 10
           WHEN l.bedrooms = b.min_bedrooms - 1 THEN 4 ELSE 0 END +
      CASE WHEN cardinality(b.features) = 0 THEN 5 ELSE 5.0 * (
        SELECT count(*) FROM unnest(b.features) AS wanted(feature)
        WHERE EXISTS (SELECT 1 FROM unnest(l.features) AS available(feature)
          WHERE lower(trim(available.feature)) = lower(trim(wanted.feature)))
      ) / cardinality(b.features) END +
      CASE WHEN cardinality(b.required_services) = 0 THEN 5 ELSE 5.0 * (
        SELECT count(*) FROM unnest(b.required_services) AS wanted(service)
        WHERE EXISTS (SELECT 1 FROM unnest(l.required_services) AS available(service)
          WHERE lower(trim(available.service)) = lower(trim(wanted.service)))
      ) / cardinality(b.required_services) END
    ))::INTEGER) AS calculated_score
    FROM public.buyer_requests b
    CROSS JOIN owned_listing l
    WHERE b.status = 'active'
      AND (b.contact_consent = TRUE OR b.is_demo = TRUE)
      AND lower(trim(b.city)) = lower(trim(l.city))
      AND b.purpose = l.purpose
  )
  SELECT s.id,
    CASE WHEN c.verified OR s.is_demo THEN s.full_name ELSE 'مشترٍ مهتم' END AS full_name,
    CASE WHEN c.verified OR s.is_demo THEN s.phone ELSE NULL END AS phone,
    s.city, s.district, s.property_type, s.purpose,
    s.max_price, s.min_bedrooms, s.features, s.required_services,
    s.calculated_score AS match_score, s.is_demo, s.created_at
  FROM scored s CROSS JOIN caller c
  WHERE s.calculated_score >= 45
  ORDER BY s.calculated_score DESC, s.created_at DESC LIMIT 20;
$function$;

REVOKE ALL ON FUNCTION public.match_buyers_for_property(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_buyers_for_property(uuid) TO authenticated;

-- 2) log_deal_view: drop SECURITY DEFINER, use RLS + trigger -----------------
CREATE OR REPLACE FUNCTION public.bump_gallery_deal_clicks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.view_type = 'click' THEN
    UPDATE public.gallery_deals SET clicks_count = clicks_count + 1 WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.bump_gallery_deal_clicks() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bump_gallery_deal_clicks ON public.gallery_deal_views;
CREATE TRIGGER trg_bump_gallery_deal_clicks
AFTER INSERT ON public.gallery_deal_views
FOR EACH ROW EXECUTE FUNCTION public.bump_gallery_deal_clicks();

GRANT INSERT ON public.gallery_deal_views TO anon, authenticated;

DROP POLICY IF EXISTS "anyone can log deal views" ON public.gallery_deal_views;
CREATE POLICY "anyone can log deal views"
ON public.gallery_deal_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_deal_view(
  p_deal_id uuid,
  p_view_type text DEFAULT 'view'::text,
  p_page_path text DEFAULT NULL::text,
  p_referrer text DEFAULT NULL::text,
  p_user_agent text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.gallery_deal_views (deal_id, view_type, user_id, page_path, referrer, user_agent)
  VALUES (p_deal_id, left(coalesce(p_view_type,'view'),10), auth.uid(), left(p_page_path,300), left(p_referrer,500), left(p_user_agent,500));
END; $function$;

REVOKE ALL ON FUNCTION public.log_deal_view(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_deal_view(uuid, text, text, text, text) TO anon, authenticated;

-- 3) Remove anon/PUBLIC execute from every remaining SECURITY DEFINER fn -----
REVOKE ALL ON FUNCTION public.assign_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.revoke_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.get_bots_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bots_status() TO authenticated;
REVOKE ALL ON FUNCTION public.get_sync_schedule() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sync_schedule() TO authenticated;
REVOKE ALL ON FUNCTION public.set_sync_schedule(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_sync_schedule(text, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.get_search_console_schedule() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_search_console_schedule() TO authenticated;
REVOKE ALL ON FUNCTION public.set_search_console_schedule(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_search_console_schedule(text, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;