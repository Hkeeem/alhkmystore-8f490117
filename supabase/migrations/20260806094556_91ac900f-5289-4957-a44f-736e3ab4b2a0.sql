CREATE OR REPLACE FUNCTION public.guard_deal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تحديث عدّاد النقرات فقط (لا تغيير في أي حقل آخر) مسموح دائماً
  IF (to_jsonb(NEW) - 'clicks' - 'updated_at') = (to_jsonb(OLD) - 'clicks' - 'updated_at') THEN
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