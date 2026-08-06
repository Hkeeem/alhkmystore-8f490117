CREATE TABLE public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id uuid REFERENCES public.affiliate_clicks(id) ON DELETE SET NULL,
  deal_id uuid,
  network text NOT NULL,
  order_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network, order_id)
);

GRANT SELECT ON public.affiliate_conversions TO authenticated;
GRANT ALL ON public.affiliate_conversions TO service_role;

ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read conversions"
ON public.affiliate_conversions FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE TRIGGER affiliate_conversions_updated_at
BEFORE UPDATE ON public.affiliate_conversions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX affiliate_conversions_click_idx ON public.affiliate_conversions (click_id);
CREATE INDEX affiliate_conversions_created_idx ON public.affiliate_conversions (created_at DESC);

CREATE OR REPLACE FUNCTION public.register_affiliate_click_returning(
  _deal_id uuid,
  _network text DEFAULT NULL,
  _source text DEFAULT NULL,
  _referrer text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _country text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.affiliate_clicks (deal_id, network, source, referrer, user_agent, country)
  VALUES (_deal_id, _network, left(_source, 120), left(_referrer, 500), left(_user_agent, 500), left(_country, 8))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_affiliate_click_returning(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_affiliate_click_returning(uuid, text, text, text, text, text) TO service_role;