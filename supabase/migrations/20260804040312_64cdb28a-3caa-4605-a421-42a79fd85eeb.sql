-- 1) Remove the open self-claim super_admin RPC (bootstrap now happens server-side with a setup token)
DROP FUNCTION IF EXISTS public.claim_super_admin();

-- 2) Lock down SECURITY DEFINER functions that must not be callable from the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_deal_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_merchant_status() FROM PUBLIC, anon, authenticated;

-- has_role / is_staff are used inside RLS policies and must remain callable by the querying role,
-- but anon never needs them directly.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- role management RPCs already verify super_admin internally
REVOKE ALL ON FUNCTION public.assign_user_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, public.app_role) TO authenticated;

-- 3) Harden merchant / deal owner updates at the policy level (defence in depth on top of triggers)
DROP POLICY IF EXISTS merchants_owner_update ON public.merchants;
CREATE POLICY merchants_owner_update ON public.merchants
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id
    AND (
      public.is_staff(auth.uid())
      OR status = (SELECT m.status FROM public.merchants m WHERE m.id = merchants.id)
    )
  );

DROP POLICY IF EXISTS deals_owner_update ON public.merchant_deals;
CREATE POLICY deals_owner_update ON public.merchant_deals
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_deals.merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_deals.merchant_id AND m.owner_id = auth.uid())
    AND (
      public.is_staff(auth.uid())
      OR status IN ('draft','pending')
    )
  );