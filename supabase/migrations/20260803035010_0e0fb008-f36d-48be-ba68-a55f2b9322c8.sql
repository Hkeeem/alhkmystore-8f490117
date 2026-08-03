CREATE TABLE public.external_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manual',
  source_key text NOT NULL,
  store_id text NOT NULL,
  store_name text,
  title text NOT NULL,
  brand text,
  category text NOT NULL DEFAULT 'سوبرماركت',
  unit text,
  original_price numeric NOT NULL,
  price numeric NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  image_url text,
  product_url text,
  product_key text,
  expires_at timestamp with time zone,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (source, source_key)
);

CREATE INDEX external_deals_active_idx ON public.external_deals (active, discount_percent DESC);
CREATE INDEX external_deals_store_idx ON public.external_deals (store_id);
CREATE INDEX external_deals_product_key_idx ON public.external_deals (product_key);

GRANT SELECT ON public.external_deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_deals TO authenticated;
GRANT ALL ON public.external_deals TO service_role;

ALTER TABLE public.external_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_deals_public_read ON public.external_deals
  FOR SELECT TO anon, authenticated
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY external_deals_staff_read ON public.external_deals
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY external_deals_staff_insert ON public.external_deals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY external_deals_staff_update ON public.external_deals
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY external_deals_staff_delete ON public.external_deals
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER external_deals_set_updated_at
  BEFORE UPDATE ON public.external_deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();