CREATE TABLE public.marketing_bots (
  key text PRIMARY KEY,
  label text NOT NULL,
  platform text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  offset_minutes integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  last_status text,
  posts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_bots TO authenticated;
GRANT ALL ON public.marketing_bots TO service_role;
ALTER TABLE public.marketing_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_bots staff read" ON public.marketing_bots FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "marketing_bots staff write" ON public.marketing_bots FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  title text,
  content text NOT NULL,
  image_url text,
  link_url text,
  status text NOT NULL DEFAULT 'pending',
  external_id text,
  error text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_posts TO authenticated;
GRANT ALL ON public.marketing_posts TO service_role;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_posts staff read" ON public.marketing_posts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX marketing_posts_platform_created_idx ON public.marketing_posts (platform, created_at DESC);

CREATE TRIGGER marketing_bots_updated_at BEFORE UPDATE ON public.marketing_bots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.marketing_bots (key, label, platform, offset_minutes) VALUES
  ('store_marketing', 'بوت تسويق المتاجر', 'store', 0),
  ('twitter', 'بوت إكس (تويتر)', 'twitter', 10),
  ('instagram', 'بوت إنستغرام', 'instagram', 20),
  ('tiktok', 'بوت تيك توك', 'tiktok', 30),
  ('snapchat', 'بوت سناب شات', 'snapchat', 40);