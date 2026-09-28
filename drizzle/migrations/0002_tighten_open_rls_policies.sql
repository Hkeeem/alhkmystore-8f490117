DROP POLICY IF EXISTS "anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "insert analytics events with validated shape" ON public.analytics_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND char_length(event) BETWEEN 1 AND 100
  AND (path IS NULL OR char_length(path) <= 500)
  AND pg_column_size(payload) <= 8192
);

DROP POLICY IF EXISTS "anyone can log deal views" ON public.gallery_deal_views;
CREATE POLICY "log deal views with validated shape" ON public.gallery_deal_views
FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND view_type IN ('view','click')
  AND deal_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.gallery_deals d WHERE d.id = deal_id AND d.is_active)
  AND (page_path IS NULL OR char_length(page_path) <= 500)
  AND (referrer IS NULL OR char_length(referrer) <= 1000)
  AND (user_agent IS NULL OR char_length(user_agent) <= 500)
);

DROP POLICY IF EXISTS "price_history public read" ON public.price_history;
CREATE POLICY "staff can read price history" ON public.price_history
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));