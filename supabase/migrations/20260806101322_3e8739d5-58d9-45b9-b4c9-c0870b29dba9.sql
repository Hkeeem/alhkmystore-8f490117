CREATE TABLE IF NOT EXISTS public.sync_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('success','failure')),
  code text,
  message text,
  keyword text,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS sync_events_source_created_idx ON public.sync_events (source, created_at DESC);
GRANT ALL ON public.sync_events TO service_role;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;