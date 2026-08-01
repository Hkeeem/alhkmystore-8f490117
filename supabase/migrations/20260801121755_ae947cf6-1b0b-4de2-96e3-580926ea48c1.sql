-- ============ ENUMS ============
CREATE TYPE public.merchant_status AS ENUM ('pending','verified','rejected','suspended');
CREATE TYPE public.deal_status AS ENUM ('draft','pending','published','rejected','expired');

-- ============ MERCHANTS ============
CREATE TABLE public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  category text NOT NULL DEFAULT 'other',
  city text,
  cr_number text,
  website text,
  phone text,
  status public.merchant_status NOT NULL DEFAULT 'pending',
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX merchants_owner_idx ON public.merchants(owner_id);
CREATE INDEX merchants_status_idx ON public.merchants(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchants TO authenticated;
GRANT SELECT ON public.merchants TO anon;
GRANT ALL ON public.merchants TO service_role;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchants_public_read ON public.merchants
  FOR SELECT TO anon, authenticated USING (status = 'verified');
CREATE POLICY merchants_owner_read ON public.merchants
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.is_staff(auth.uid()));
CREATE POLICY merchants_owner_insert ON public.merchants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND status = 'pending');
CREATE POLICY merchants_owner_update ON public.merchants
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY merchants_staff_update ON public.merchants
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY merchants_admin_delete ON public.merchants
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));

-- منع التاجر من توثيق نفسه
CREATE OR REPLACE FUNCTION public.guard_merchant_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'only staff can change merchant status';
  END IF;
  NEW.owner_id := OLD.owner_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER merchants_guard BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.guard_merchant_status();
CREATE TRIGGER merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MERCHANT DEALS ============
CREATE TABLE public.merchant_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  category text NOT NULL DEFAULT 'other',
  unit text,
  original_price numeric(10,2) NOT NULL CHECK (original_price > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  discount_percent int GENERATED ALWAYS AS
    (CASE WHEN original_price > 0
      THEN GREATEST(0, ROUND(((original_price - price) / original_price) * 100)::int)
      ELSE 0 END) STORED,
  product_url text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status public.deal_status NOT NULL DEFAULT 'draft',
  review_note text,
  clicks int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX merchant_deals_merchant_idx ON public.merchant_deals(merchant_id);
CREATE INDEX merchant_deals_status_idx ON public.merchant_deals(status);
CREATE INDEX merchant_deals_discount_idx ON public.merchant_deals(discount_percent DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_deals TO authenticated;
GRANT SELECT ON public.merchant_deals TO anon;
GRANT ALL ON public.merchant_deals TO service_role;
ALTER TABLE public.merchant_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY deals_public_read ON public.merchant_deals
  FOR SELECT TO anon, authenticated USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.status = 'verified')
  );
CREATE POLICY deals_owner_read ON public.merchant_deals
  FOR SELECT TO authenticated USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
  );
CREATE POLICY deals_owner_insert ON public.merchant_deals
  FOR INSERT TO authenticated WITH CHECK (
    status IN ('draft','pending')
    AND EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
  );
CREATE POLICY deals_owner_update ON public.merchant_deals
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
  );
CREATE POLICY deals_staff_update ON public.merchant_deals
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY deals_owner_delete ON public.merchant_deals
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
  );

-- منع التاجر من نشر عرضه بنفسه أو تعديل عدّاد النقرات
CREATE OR REPLACE FUNCTION public.guard_deal_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
END; $$;
CREATE TRIGGER merchant_deals_guard BEFORE UPDATE ON public.merchant_deals
  FOR EACH ROW EXECUTE FUNCTION public.guard_deal_status();
CREATE TRIGGER merchant_deals_updated_at BEFORE UPDATE ON public.merchant_deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();