CREATE TABLE public.store_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  store_name text NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  district text,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  phone text,
  whatsapp text,
  hours text,
  balady_url text,
  maps_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_branches TO authenticated;
GRANT ALL ON public.store_branches TO service_role;

ALTER TABLE public.store_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_branches_public_read_active"
ON public.store_branches FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "store_branches_staff_manage"
ON public.store_branches FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX store_branches_city_idx ON public.store_branches (city);
CREATE INDEX store_branches_store_idx ON public.store_branches (store_id);