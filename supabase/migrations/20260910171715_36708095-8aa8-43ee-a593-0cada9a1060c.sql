CREATE TABLE public.affiliate_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  site_url text NOT NULL,
  network text NOT NULL DEFAULT 'other',
  network_account_id text,
  network_account_email text,
  tracking_template text,
  affiliate_param text,
  category text,
  city text,
  logo_url text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_stores TO authenticated;
GRANT ALL ON public.affiliate_stores TO service_role;
ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate_stores public read active" ON public.affiliate_stores
  FOR SELECT TO anon, authenticated USING (active = true OR public.is_staff(auth.uid()));
CREATE POLICY "affiliate_stores staff insert" ON public.affiliate_stores
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "affiliate_stores staff update" ON public.affiliate_stores
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "affiliate_stores staff delete" ON public.affiliate_stores
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER affiliate_stores_updated_at BEFORE UPDATE ON public.affiliate_stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX affiliate_stores_network_idx ON public.affiliate_stores (network);

CREATE TABLE public.offer_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'offer',
  offer_id text NOT NULL,
  offer_title text,
  store_id text,
  store_name text,
  coupon_code text,
  surface text NOT NULL DEFAULT 'list',
  path text,
  session text,
  city text,
  country text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offer_clicks TO authenticated;
GRANT ALL ON public.offer_clicks TO service_role;
ALTER TABLE public.offer_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer_clicks staff read" ON public.offer_clicks
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX offer_clicks_created_idx ON public.offer_clicks (created_at DESC);
CREATE INDEX offer_clicks_offer_idx ON public.offer_clicks (offer_id);

CREATE TABLE public.coupon_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id text NOT NULL,
  coupon_code text,
  store_id text,
  store_name text,
  site_url text,
  offer_url text,
  reason text NOT NULL DEFAULT 'not_working',
  note text,
  status text NOT NULL DEFAULT 'open',
  session text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_reports TO authenticated;
GRANT UPDATE ON public.coupon_reports TO authenticated;
GRANT ALL ON public.coupon_reports TO service_role;
ALTER TABLE public.coupon_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_reports owner or staff read" ON public.coupon_reports
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "coupon_reports staff update" ON public.coupon_reports
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER coupon_reports_updated_at BEFORE UPDATE ON public.coupon_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX coupon_reports_status_idx ON public.coupon_reports (status, created_at DESC);