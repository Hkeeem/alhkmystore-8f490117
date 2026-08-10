CREATE TABLE public.search_console_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  submitted integer NOT NULL DEFAULT 0,
  indexed integer NOT NULL DEFAULT 0,
  sitemap_errors integer NOT NULL DEFAULT 0,
  sitemap_warnings integer NOT NULL DEFAULT 0,
  inspected_urls integer NOT NULL DEFAULT 0,
  indexed_urls integer NOT NULL DEFAULT 0,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.search_console_snapshots TO authenticated;
GRANT ALL ON public.search_console_snapshots TO service_role;

ALTER TABLE public.search_console_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view search console snapshots"
ON public.search_console_snapshots
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE INDEX idx_sc_snapshots_site_created ON public.search_console_snapshots (site_url, created_at DESC);