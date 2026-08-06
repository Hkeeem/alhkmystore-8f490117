CREATE TABLE public.report_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.report_recipients TO authenticated;
GRANT ALL ON public.report_recipients TO service_role;
ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read recipients" ON public.report_recipients FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER report_recipients_updated_at BEFORE UPDATE ON public.report_recipients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  days integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'sent',
  recipients integer NOT NULL DEFAULT 0,
  error text,
  summary jsonb,
  triggered_by text NOT NULL DEFAULT 'cron',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.report_runs TO authenticated;
GRANT ALL ON public.report_runs TO service_role;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read report runs" ON public.report_runs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX report_runs_created_idx ON public.report_runs (created_at DESC);