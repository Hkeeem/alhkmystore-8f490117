ALTER TABLE public.offer_clicks
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'click',
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS offer_clicks_event_type_idx ON public.offer_clicks (event_type);
CREATE INDEX IF NOT EXISTS offer_clicks_occurred_at_idx ON public.offer_clicks (occurred_at DESC);
CREATE INDEX IF NOT EXISTS offer_clicks_store_id_idx ON public.offer_clicks (store_id);