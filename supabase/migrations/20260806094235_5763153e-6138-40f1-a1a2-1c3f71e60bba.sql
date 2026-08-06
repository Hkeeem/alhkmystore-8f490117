CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.merchant_deals(id) ON DELETE CASCADE,
  network text,
  source text,
  referrer text,
  user_agent text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX affiliate_clicks_deal_id_idx ON public.affiliate_clicks(deal_id, created_at DESC);

GRANT ALL ON public.affiliate_clicks TO service_role;
GRANT SELECT ON public.affiliate_clicks TO authenticated;

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read affiliate clicks"
ON public.affiliate_clicks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.register_affiliate_click(
  _deal_id uuid,
  _network text DEFAULT NULL,
  _source text DEFAULT NULL,
  _referrer text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _country text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.affiliate_clicks (deal_id, network, source, referrer, user_agent, country)
  VALUES (_deal_id, _network, left(_source, 120), left(_referrer, 500), left(_user_agent, 500), left(_country, 8));

  UPDATE public.merchant_deals SET clicks = clicks + 1 WHERE id = _deal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_affiliate_click(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_affiliate_click(uuid, text, text, text, text, text) TO service_role;