CREATE TABLE public.push_dispatch_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_key text NOT NULL UNIQUE,
  kind text NOT NULL,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_dispatch_log TO service_role;
ALTER TABLE public.push_dispatch_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX push_dispatch_log_created_at_idx ON public.push_dispatch_log (created_at DESC);