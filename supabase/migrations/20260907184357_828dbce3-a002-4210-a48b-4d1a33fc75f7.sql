CREATE TABLE public.store_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  feed_type TEXT NOT NULL DEFAULT 'auto',
  category TEXT NOT NULL DEFAULT 'عام',
  affiliate_param TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  last_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_feeds TO authenticated;
GRANT ALL ON public.store_feeds TO service_role;

ALTER TABLE public.store_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_view_store_feeds" ON public.store_feeds
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_store_feeds" ON public.store_feeds
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_store_feeds" ON public.store_feeds
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_delete_store_feeds" ON public.store_feeds
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));