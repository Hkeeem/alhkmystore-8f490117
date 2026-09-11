CREATE TABLE public.showroom_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  brand text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  offer_url text,
  category text NOT NULL DEFAULT 'عام',
  city text,
  original_price numeric,
  price numeric,
  discount_percent integer NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.showroom_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showroom_offers TO authenticated;
GRANT ALL ON public.showroom_offers TO service_role;
ALTER TABLE public.showroom_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "showroom public read" ON public.showroom_offers FOR SELECT USING (active = true);
CREATE POLICY "showroom staff manage" ON public.showroom_offers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER showroom_offers_updated_at BEFORE UPDATE ON public.showroom_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.haraj_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  image_url text,
  post_url text NOT NULL,
  price numeric,
  city text,
  author text,
  posted_at timestamptz,
  rank integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.haraj_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.haraj_listings TO authenticated;
GRANT ALL ON public.haraj_listings TO service_role;
ALTER TABLE public.haraj_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "haraj public read" ON public.haraj_listings FOR SELECT USING (active = true);
CREATE POLICY "haraj staff manage" ON public.haraj_listings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER haraj_listings_updated_at BEFORE UPDATE ON public.haraj_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.office_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('property','developer')),
  source_key text NOT NULL,
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  price numeric,
  city text,
  rating numeric,
  rank integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, source_key)
);
GRANT SELECT ON public.office_picks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_picks TO authenticated;
GRANT ALL ON public.office_picks TO service_role;
ALTER TABLE public.office_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office picks public read" ON public.office_picks FOR SELECT USING (active = true);
CREATE POLICY "office picks staff manage" ON public.office_picks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER office_picks_updated_at BEFORE UPDATE ON public.office_picks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();