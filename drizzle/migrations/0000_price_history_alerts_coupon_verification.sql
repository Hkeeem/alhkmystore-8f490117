-- A) سجل الأسعار التاريخي
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  store_id text NOT NULL,
  price numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX price_history_product_captured_idx ON public.price_history (product_id, captured_at DESC);

GRANT SELECT ON public.price_history TO anon, authenticated;
GRANT ALL ON public.price_history TO service_role;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_history public read" ON public.price_history FOR SELECT TO anon, authenticated USING (true);

-- B) أعمدة تنبيهات الأسعار الإضافية
ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'push',
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

ALTER TABLE public.price_alerts DROP CONSTRAINT IF EXISTS price_alerts_channel_check;
ALTER TABLE public.price_alerts ADD CONSTRAINT price_alerts_channel_check CHECK (channel IN ('push','email'));

-- C) أعمدة التحقق من الكوبونات
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS coupon_reports_coupon_user_uidx
  ON public.coupon_reports (coupon_id, user_id)
  WHERE user_id IS NOT NULL;