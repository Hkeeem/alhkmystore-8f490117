CREATE OR REPLACE FUNCTION public.guard_deal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  baseline public.merchant_deals;
BEGIN
  baseline := OLD;
  baseline.clicks := NEW.clicks;
  baseline.updated_at := NEW.updated_at;

  -- تحديث عدّاد النقرات فقط مسموح دائماً
  IF NEW IS NOT DISTINCT FROM baseline THEN
    RETURN NEW;
  END IF;

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