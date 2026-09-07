CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  handle text NOT NULL,
  display_name text,
  feed_url text,
  city text,
  lat double precision,
  lng double precision,
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_status text,
  last_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, handle)
);

GRANT SELECT ON public.social_accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_accounts_public_read" ON public.social_accounts
  FOR SELECT USING (active = true);
CREATE POLICY "social_accounts_staff_read" ON public.social_accounts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "social_accounts_staff_insert" ON public.social_accounts
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "social_accounts_staff_update" ON public.social_accounts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "social_accounts_staff_delete" ON public.social_accounts
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL,
  source_key text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  post_url text,
  coupon_code text,
  original_price numeric,
  price numeric,
  discount_percent integer,
  city text,
  lat double precision,
  lng double precision,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, source_key)
);

GRANT SELECT ON public.social_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_offers TO authenticated;
GRANT ALL ON public.social_offers TO service_role;

ALTER TABLE public.social_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_offers_public_read" ON public.social_offers
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "social_offers_staff_read" ON public.social_offers
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "social_offers_staff_insert" ON public.social_offers
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "social_offers_staff_update" ON public.social_offers
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "social_offers_staff_delete" ON public.social_offers
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER social_offers_updated_at BEFORE UPDATE ON public.social_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX social_offers_active_idx ON public.social_offers (active, expires_at DESC);
CREATE INDEX social_offers_geo_idx ON public.social_offers (lat, lng);