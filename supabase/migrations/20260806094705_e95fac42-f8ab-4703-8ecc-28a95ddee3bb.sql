CREATE OR REPLACE FUNCTION public.guard_deal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('draft','pending') THEN
      RAISE EXCEPTION 'only staff can publish or reject deals';
    END IF;
    IF OLD.status IN ('published','rejected') AND NEW.status NOT IN ('draft','pending') THEN
      RAISE EXCEPTION 'only staff can change a reviewed deal';
    END IF;
    NEW.clicks := OLD.clicks;
  END IF;
  NEW.merchant_id := OLD.merchant_id;
  RETURN NEW;
END; $function$;

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
END;
$$;

CREATE OR REPLACE VIEW public.affiliate_click_stats
WITH (security_invoker = true) AS
SELECT deal_id, count(*)::bigint AS clicks, max(created_at) AS last_click_at
FROM public.affiliate_clicks
GROUP BY deal_id;

GRANT SELECT ON public.affiliate_click_stats TO authenticated;
GRANT ALL ON public.affiliate_click_stats TO service_role;