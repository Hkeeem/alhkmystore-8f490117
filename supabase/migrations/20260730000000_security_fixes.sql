
-- 1. Revoke public execution on all functions by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 2. Revoke execute on specific functions already created
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;

-- 3. Restrict profiles visibility
-- Current: CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (true);
-- Note: If public needs to see some profile info (like display_name), we should use a view or restricted columns.
-- But for now, restricting to authenticated users is safer.

-- 4. Fix claim_super_admin to be more secure or remove it
-- If we keep it, it should at least check if the user is authenticated (which it does)
-- but maybe we should disable it once a super_admin exists permanently.
-- The current implementation already returns false if a super_admin exists.
-- To be even safer, we can revoke execute from authenticated and only allow it for a specific bootstrap period.
-- However, for now, let's just make sure it's not exposed to anon (already done in previous migration, but good to reinforce).
REVOKE EXECUTE ON FUNCTION public.claim_super_admin() FROM PUBLIC, anon;

-- 5. Tighten grants on sensitive tables
REVOKE ALL ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
-- We don't grant INSERT to authenticated because handle_new_user trigger does it as SECURITY DEFINER.
-- This prevents users from manually creating profiles for other IDs.

