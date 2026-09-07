CREATE TABLE public.deal_alert_settings (
  id boolean PRIMARY KEY DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  lead_hours integer NOT NULL DEFAULT 24 CHECK (lead_hours BETWEEN 1 AND 168),
  coupons_enabled boolean NOT NULL DEFAULT true,
  coupon_window_hours integer NOT NULL DEFAULT 24 CHECK (coupon_window_hours BETWEEN 1 AND 168),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deal_alert_settings_singleton CHECK (id)
);

GRANT SELECT ON public.deal_alert_settings TO authenticated;
GRANT ALL ON public.deal_alert_settings TO service_role;

ALTER TABLE public.deal_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read alert settings"
  ON public.deal_alert_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff can update alert settings"
  ON public.deal_alert_settings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER deal_alert_settings_updated_at
  BEFORE UPDATE ON public.deal_alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.deal_alert_settings (id) VALUES (true);