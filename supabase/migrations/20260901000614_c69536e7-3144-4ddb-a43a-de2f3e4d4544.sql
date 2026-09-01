CREATE TABLE IF NOT EXISTS public.buyer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  phone TEXT CHECK (phone ~ '^(?:\+?966|0)5[0-9]{8}$'),
  purpose TEXT NOT NULL DEFAULT 'شراء' CHECK (purpose IN ('شراء', 'إيجار')),
  city TEXT NOT NULL CHECK (char_length(trim(city)) BETWEEN 2 AND 120),
  district TEXT NOT NULL CHECK (char_length(trim(district)) BETWEEN 2 AND 160),
  property_type TEXT NOT NULL CHECK (char_length(trim(property_type)) BETWEEN 2 AND 80),
  max_price NUMERIC(14, 2) NOT NULL CHECK (max_price > 0),
  min_bedrooms SMALLINT NOT NULL CHECK (min_bedrooms BETWEEN 0 AND 20),
  features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  required_services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  contact_consent BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS buyer_requests_match_lookup_idx
  ON public.buyer_requests (city, district, property_type, purpose, max_price, min_bedrooms);
CREATE INDEX IF NOT EXISTS buyer_requests_user_created_idx
  ON public.buyer_requests (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.buyer_requests TO authenticated;
GRANT ALL ON public.buyer_requests TO service_role;

ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert their own buyer requests" ON public.buyer_requests;
CREATE POLICY "Users insert their own buyer requests"
  ON public.buyer_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND contact_consent = TRUE AND is_demo = FALSE);

DROP POLICY IF EXISTS "Users read their own buyer requests" ON public.buyer_requests;
CREATE POLICY "Users read their own buyer requests"
  ON public.buyer_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.property_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  purpose TEXT NOT NULL DEFAULT 'شراء' CHECK (purpose IN ('شراء', 'إيجار')),
  city TEXT NOT NULL CHECK (char_length(trim(city)) BETWEEN 2 AND 120),
  district TEXT NOT NULL CHECK (char_length(trim(district)) BETWEEN 2 AND 160),
  property_type TEXT NOT NULL CHECK (char_length(trim(property_type)) BETWEEN 2 AND 80),
  price NUMERIC(14, 2) NOT NULL CHECK (price > 0),
  bedrooms SMALLINT NOT NULL CHECK (bedrooms BETWEEN 0 AND 20),
  features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  required_services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_listings_owner_created_idx
  ON public.property_listings (owner_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_listings TO authenticated;
GRANT ALL ON public.property_listings TO service_role;

ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage their property listings" ON public.property_listings;
CREATE POLICY "Owners manage their property listings"
  ON public.property_listings FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.match_buyers_for_property(p_listing_id UUID)
RETURNS TABLE (
  id UUID, full_name TEXT, phone TEXT, city TEXT, district TEXT,
  property_type TEXT, purpose TEXT, max_price NUMERIC, min_bedrooms SMALLINT,
  features TEXT[], required_services TEXT[], match_score INTEGER,
  is_demo BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH owned_listing AS (
    SELECT l.* FROM public.property_listings l
    WHERE l.id = p_listing_id AND l.owner_id = auth.uid() AND l.status = 'active'
  ), scored AS (
    SELECT b.*, LEAST(100, GREATEST(0, ROUND(
      35 +
      CASE WHEN lower(trim(b.district)) = lower(trim(l.district)) THEN 20 ELSE 7 END +
      CASE WHEN lower(trim(b.property_type)) = lower(trim(l.property_type)) THEN 15 ELSE 0 END +
      CASE WHEN l.price <= b.max_price THEN 15
           WHEN l.price <= b.max_price * 1.10 THEN 8
           WHEN l.price <= b.max_price * 1.20 THEN 3 ELSE 0 END +
      CASE WHEN l.bedrooms >= b.min_bedrooms THEN 10
           WHEN l.bedrooms = b.min_bedrooms - 1 THEN 4 ELSE 0 END +
      CASE WHEN cardinality(b.features) = 0 THEN 5 ELSE 5.0 * (
        SELECT count(*) FROM unnest(b.features) AS wanted(feature)
        WHERE EXISTS (SELECT 1 FROM unnest(l.features) AS available(feature)
          WHERE lower(trim(available.feature)) = lower(trim(wanted.feature)))
      ) / cardinality(b.features) END +
      CASE WHEN cardinality(b.required_services) = 0 THEN 5 ELSE 5.0 * (
        SELECT count(*) FROM unnest(b.required_services) AS wanted(service)
        WHERE EXISTS (SELECT 1 FROM unnest(l.required_services) AS available(service)
          WHERE lower(trim(available.service)) = lower(trim(wanted.service)))
      ) / cardinality(b.required_services) END
    ))::INTEGER) AS calculated_score
    FROM public.buyer_requests b
    CROSS JOIN owned_listing l
    WHERE b.status = 'active'
      AND (b.contact_consent = TRUE OR b.is_demo = TRUE)
      AND lower(trim(b.city)) = lower(trim(l.city))
      AND b.purpose = l.purpose
  )
  SELECT id, full_name, phone, city, district, property_type, purpose,
    max_price, min_bedrooms, features, required_services,
    calculated_score AS match_score, is_demo, created_at
  FROM scored WHERE calculated_score >= 45
  ORDER BY calculated_score DESC, created_at DESC LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.match_buyers_for_property(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_buyers_for_property(UUID) TO authenticated;

INSERT INTO public.buyer_requests (
  user_id, full_name, phone, purpose, city, district, property_type,
  max_price, min_bedrooms, features, required_services, contact_consent, is_demo
)
SELECT NULL, seed.full_name, NULL, seed.purpose, seed.city, seed.district, seed.property_type,
  seed.max_price, seed.min_bedrooms, seed.features, seed.required_services, FALSE, TRUE
FROM (
  VALUES
    ('باحث تجريبي — الروضة', 'شراء', 'جدة', 'الروضة', 'شقة', 900000::NUMERIC, 3::SMALLINT, ARRAY['مطبخ راكب', 'مصعد']::TEXT[], ARRAY['مدارس', 'مستشفى']::TEXT[]),
    ('باحث تجريبي — الشاطئ', 'شراء', 'جدة', 'الشاطئ', 'فيلا', 3200000::NUMERIC, 5::SMALLINT, ARRAY['مسبح', 'حديقة']::TEXT[], ARRAY['كورنيش', 'مدارس']::TEXT[]),
    ('باحث تجريبي — العليا', 'إيجار', 'الرياض', 'العليا', 'شقة', 85000::NUMERIC, 2::SMALLINT, ARRAY['مصعد']::TEXT[], ARRAY['مترو', 'سوبرماركت']::TEXT[]),
    ('باحث تجريبي — الدمام', 'شراء', 'الدمام', 'حي الأثير', 'شقة', 780000::NUMERIC, 3::SMALLINT, ARRAY['موقف سيارة', 'مصعد']::TEXT[], ARRAY['مدارس', 'سوبرماركت']::TEXT[]),
    ('باحث تجريبي — الخبر', 'إيجار', 'الخبر', 'حي الاندلس', 'شقة', 72000::NUMERIC, 2::SMALLINT, ARRAY['مفروش جزئياً', 'مصعد']::TEXT[], ARRAY['كورنيش', 'صيدلية']::TEXT[]),
    ('باحث تجريبي — المدينة', 'شراء', 'المدينة المنورة', 'الحرم الشريف', 'شقة', 1100000::NUMERIC, 3::SMALLINT, ARRAY['موقف سيارة']::TEXT[], ARRAY['مسجد', 'مدارس']::TEXT[]),
    ('باحث تجريبي — بريدة', 'شراء', 'بريدة', 'حي الأخضر', 'فيلا', 1450000::NUMERIC, 4::SMALLINT, ARRAY['حديقة', 'مجلس مستقل']::TEXT[], ARRAY['مدارس', 'مسجد']::TEXT[]),
    ('باحث تجريبي — تبوك', 'إيجار', 'تبوك', 'البلدة القديمة', 'شقة', 60000::NUMERIC, 2::SMALLINT, ARRAY['مطبخ راكب']::TEXT[], ARRAY['سوبرماركت', 'طريق رئيسي']::TEXT[]),
    ('باحث تجريبي — حائل', 'شراء', 'حائل', 'حي اجا', 'دوبلكس', 1250000::NUMERIC, 4::SMALLINT, ARRAY['موقف سيارتين', 'مجلس مستقل']::TEXT[], ARRAY['مدارس', 'حدائق']::TEXT[]),
    ('باحث تجريبي — جازان', 'شراء', 'جازان', 'حي الروضة', 'شقة', 580000::NUMERIC, 3::SMALLINT, ARRAY['مصعد']::TEXT[], ARRAY['مستشفى', 'سوبرماركت']::TEXT[]),
    ('باحث تجريبي — نجران', 'إيجار', 'نجران', 'المطار', 'شقة', 54000::NUMERIC, 2::SMALLINT, ARRAY['موقف سيارة']::TEXT[], ARRAY['طريق رئيسي', 'صيدلية']::TEXT[]),
    ('باحث تجريبي — الباحة', 'شراء', 'الباحة', 'حي الروضة', 'فيلا', 1150000::NUMERIC, 4::SMALLINT, ARRAY['حديقة', 'مسبح']::TEXT[], ARRAY['مدارس', 'حدائق']::TEXT[]),
    ('باحث تجريبي — سكاكا', 'شراء', 'سكاكا', 'حي أحد', 'شقة', 620000::NUMERIC, 3::SMALLINT, ARRAY['مطبخ راكب']::TEXT[], ARRAY['مستشفى', 'مسجد']::TEXT[])
) AS seed(full_name, purpose, city, district, property_type, max_price, min_bedrooms, features, required_services)
WHERE NOT EXISTS (
  SELECT 1 FROM public.buyer_requests b WHERE b.full_name = seed.full_name AND b.is_demo = TRUE
);