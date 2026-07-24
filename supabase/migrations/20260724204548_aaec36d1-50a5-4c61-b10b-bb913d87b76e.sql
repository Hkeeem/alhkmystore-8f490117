
-- Helper: is_staff (any admin-level role)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin','support','content_manager')
  )
$$;

-- Complaints
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY complaints_owner_read ON public.complaints FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'));
CREATE POLICY complaints_owner_insert ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY complaints_staff_update ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'support'));

-- Suggestions
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  tag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY suggestions_read ON public.suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_manager'));
CREATE POLICY suggestions_insert ON public.suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY suggestions_staff_update ON public.suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_manager'));

-- Premium subscriptions
CREATE TABLE public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_subscriptions TO authenticated;
GRANT ALL ON public.premium_subscriptions TO service_role;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY premium_read ON public.premium_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Notifications broadcast column
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_broadcast boolean NOT NULL DEFAULT false;

-- updated_at trigger reuse
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER complaints_touch BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER suggestions_touch BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER premium_touch BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Assign role (super_admin only)
CREATE OR REPLACE FUNCTION public.assign_user_role(_target uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, meta)
  VALUES (auth.uid(), 'assign_role', 'user_roles', _target::text, jsonb_build_object('role', _role));
END; $$;

-- Revoke role (super_admin only)
CREATE OR REPLACE FUNCTION public.revoke_user_role(_target uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
  INSERT INTO public.admin_audit_log (actor_id, action, target_table, target_id, meta)
  VALUES (auth.uid(), 'revoke_role', 'user_roles', _target::text, jsonb_build_object('role', _role));
END; $$;

-- Only authenticated staff should call these
REVOKE ALL ON FUNCTION public.assign_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role) TO authenticated;

-- Bootstrap: first user with any account becomes super_admin if none exists
CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _has boolean;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'super_admin') INTO _has;
  IF _has THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.claim_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated;
