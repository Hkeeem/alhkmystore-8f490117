
-- Cashback transactions
CREATE TABLE public.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL,
  deal_id TEXT,
  purchase_amount NUMERIC(10,2) NOT NULL CHECK (purchase_amount >= 0),
  cashback_rate NUMERIC(5,2) NOT NULL DEFAULT 2.0 CHECK (cashback_rate >= 0 AND cashback_rate <= 100),
  cashback_amount NUMERIC(10,2) NOT NULL CHECK (cashback_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','rejected')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cashback_transactions TO authenticated;
GRANT ALL ON public.cashback_transactions TO service_role;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cashback_own_select" ON public.cashback_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cashback_own_insert" ON public.cashback_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cashback_admin_update" ON public.cashback_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cashback_admin_delete" ON public.cashback_transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

CREATE INDEX idx_cashback_user ON public.cashback_transactions(user_id, created_at DESC);
CREATE INDEX idx_cashback_status ON public.cashback_transactions(status);

CREATE TRIGGER trg_cashback_updated_at BEFORE UPDATE ON public.cashback_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Price alerts
CREATE TABLE public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  product_key TEXT,
  title TEXT NOT NULL,
  current_price NUMERIC(10,2) NOT NULL CHECK (current_price >= 0),
  target_price NUMERIC(10,2) NOT NULL CHECK (target_price >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, deal_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_alerts_own" ON public.price_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_alerts_user ON public.price_alerts(user_id, active);

CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON public.price_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- View: cashback totals per user (for dashboards)
CREATE OR REPLACE VIEW public.cashback_user_totals
WITH (security_invoker = true) AS
SELECT
  user_id,
  COALESCE(SUM(cashback_amount) FILTER (WHERE status IN ('confirmed','paid')), 0) AS confirmed_total,
  COALESCE(SUM(cashback_amount) FILTER (WHERE status = 'pending'), 0) AS pending_total,
  COALESCE(SUM(cashback_amount) FILTER (WHERE status = 'paid'), 0) AS paid_total,
  COUNT(*) AS tx_count
FROM public.cashback_transactions
GROUP BY user_id;

GRANT SELECT ON public.cashback_user_totals TO authenticated;
