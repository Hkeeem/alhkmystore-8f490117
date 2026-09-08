CREATE TABLE IF NOT EXISTS public.cron_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cron_secrets TO service_role;
ALTER TABLE public.cron_secrets ENABLE ROW LEVEL SECURITY;

-- دوال المشغّلات: لا يجب أن ينفّذها أحد مباشرة
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_deal_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_merchant_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- دوال إدارية: ممنوعة على الزوار غير المسجلين
REVOKE EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_sync_schedule() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_sync_schedule(text, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_search_console_schedule() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_search_console_schedule(text, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.match_buyers_for_property(uuid) FROM anon, public;