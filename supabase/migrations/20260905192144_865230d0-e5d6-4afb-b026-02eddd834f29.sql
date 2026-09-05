ALTER TABLE public.merchant_deals ADD COLUMN IF NOT EXISTS coupon_code text;

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  store_id text,
  code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount text NOT NULL,
  min_order numeric,
  category text,
  expires_at timestamptz,
  source text NOT NULL DEFAULT 'merchant',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT TO anon, authenticated USING (active = true);