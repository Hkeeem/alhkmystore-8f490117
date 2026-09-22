GRANT SELECT, INSERT ON public.coupon_reports TO authenticated;

CREATE OR REPLACE FUNCTION public.on_coupon_report_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.coupons
     SET report_count = COALESCE(report_count, 0) + 1
   WHERE id::text = NEW.coupon_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coupon_report_count ON public.coupon_reports;
CREATE TRIGGER trg_coupon_report_count
AFTER INSERT ON public.coupon_reports
FOR EACH ROW EXECUTE FUNCTION public.on_coupon_report_insert();

CREATE POLICY "users report broken coupons"
ON public.coupon_reports
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());