
CREATE OR REPLACE FUNCTION public.get_sync_schedule()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j record;
  last_run record;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jobid, jobname, schedule, active INTO j
  FROM cron.job WHERE jobname = 'sync-external-deals' LIMIT 1;

  IF j IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  SELECT status, start_time, end_time INTO last_run
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC LIMIT 1;

  RETURN jsonb_build_object(
    'exists', true,
    'jobid', j.jobid,
    'schedule', j.schedule,
    'active', j.active,
    'lastStatus', last_run.status,
    'lastRunAt', last_run.start_time
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_sync_schedule(_schedule text, _active boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j record;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _schedule !~ '^[0-9*/,\- ]{5,40}$' THEN
    RAISE EXCEPTION 'invalid schedule';
  END IF;

  SELECT jobid, schedule, active INTO j
  FROM cron.job WHERE jobname = 'sync-external-deals' LIMIT 1;

  IF j IS NULL THEN
    RAISE EXCEPTION 'sync job not found';
  END IF;

  PERFORM cron.alter_job(job_id := j.jobid, schedule := _schedule, active := _active);

  INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, meta)
  VALUES (
    auth.uid(), 'update_sync_schedule', 'cron.job', j.jobid::text,
    jsonb_build_object('from', j.schedule, 'to', _schedule, 'wasActive', j.active, 'active', _active)
  );

  RETURN jsonb_build_object('ok', true, 'schedule', _schedule, 'active', _active);
END;
$$;

REVOKE ALL ON FUNCTION public.get_sync_schedule() FROM public;
REVOKE ALL ON FUNCTION public.set_sync_schedule(text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.get_sync_schedule() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_sync_schedule(text, boolean) TO authenticated, service_role;
