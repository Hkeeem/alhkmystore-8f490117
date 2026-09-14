CREATE OR REPLACE FUNCTION public.get_bots_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb := '[]'::jsonb;
  b record;
  j record;
  lr record;
  cnt integer;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR b IN
    SELECT * FROM (VALUES
      ('shareeti','الشريطي','store-bot-sync','store_feeds'),
      ('real_estate','الوسيط العقاري','social-sync-hourly','haraj_listings'),
      ('deals_radar','رادار العروض','sync-external-deals','external_deals'),
      ('coupon_hunter','صياد الكوبونات','sync-external-deals','coupons')
    ) AS t(key, label, jobname, source)
  LOOP
    SELECT jobid, schedule, active INTO j FROM cron.job WHERE jobname = b.jobname LIMIT 1;
    lr := NULL;
    IF j.jobid IS NOT NULL THEN
      SELECT status, start_time INTO lr FROM cron.job_run_details
      WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1;
    END IF;

    IF b.source = 'store_feeds' THEN
      SELECT COALESCE(SUM(last_count),0)::int INTO cnt FROM public.store_feeds WHERE active;
    ELSIF b.source = 'haraj_listings' THEN
      SELECT count(*)::int INTO cnt FROM public.haraj_listings WHERE active;
    ELSIF b.source = 'external_deals' THEN
      SELECT count(*)::int INTO cnt FROM public.external_deals WHERE active;
    ELSE
      SELECT count(*)::int INTO cnt FROM public.coupons WHERE active;
    END IF;

    result := result || jsonb_build_object(
      'key', b.key,
      'label', b.label,
      'jobname', b.jobname,
      'schedule', j.schedule,
      'active', COALESCE(j.active, false),
      'exists', j.jobid IS NOT NULL,
      'lastStatus', lr.status,
      'lastRunAt', lr.start_time,
      'count', COALESCE(cnt,0)
    );
  END LOOP;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bots_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bots_status() TO authenticated;