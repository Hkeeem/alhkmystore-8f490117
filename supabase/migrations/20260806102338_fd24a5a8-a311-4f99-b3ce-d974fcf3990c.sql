CREATE TABLE public.admin_saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'clicks',
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_saved_filters TO authenticated;
GRANT ALL ON public.admin_saved_filters TO service_role;

ALTER TABLE public.admin_saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read own saved filters"
ON public.admin_saved_filters FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.is_staff(auth.uid()));

CREATE POLICY "staff insert own saved filters"
ON public.admin_saved_filters FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_staff(auth.uid()));

CREATE POLICY "staff update own saved filters"
ON public.admin_saved_filters FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.is_staff(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_staff(auth.uid()));

CREATE POLICY "staff delete own saved filters"
ON public.admin_saved_filters FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.is_staff(auth.uid()));

CREATE TRIGGER admin_saved_filters_updated_at BEFORE UPDATE ON public.admin_saved_filters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX admin_saved_filters_user_scope_idx ON public.admin_saved_filters (user_id, scope);