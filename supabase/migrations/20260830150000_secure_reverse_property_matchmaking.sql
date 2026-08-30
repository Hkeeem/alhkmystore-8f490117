-- إصلاحات ملكية الإعلان وخصوصية بيانات التواصل للمطابقة العكسية.
ALTER TABLE public.buyer_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed'));

ALTER TABLE public.buyer_requests
  ALTER COLUMN phone DROP NOT NULL;

UPDATE public.buyer_requests
SET phone = NULL
WHERE is_demo = TRUE;

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
CREATE INDEX IF NOT EXISTS property_listings_match_idx
  ON public.property_listings (city, district, property_type, purpose, price, bedrooms)
  WHERE status = 'active';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_listings TO authenticated;
GRANT ALL ON public.property_listings TO service_role;

ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage their property listings" ON public.property_listings;
CREATE POLICY "Owners manage their property listings"
  ON public.property_listings
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- تسحب النتائج من إعلان مملوك لصاحب الاستدعاء فقط. لا تقبل تفاصيل حرة كي لا
-- يستخدم أي حساب الدالة لاستكشاف أرقام الباحثين من دون أن يملك إعلانًا محفوظًا.
DROP FUNCTION IF EXISTS public.match_buyers_for_property(TEXT, TEXT, TEXT, NUMERIC, INTEGER, TEXT[], TEXT[], TEXT);

CREATE OR REPLACE FUNCTION public.match_buyers_for_property(p_listing_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  district TEXT,
  property_type TEXT,
  purpose TEXT,
  max_price NUMERIC,
  min_bedrooms SMALLINT,
  features TEXT[],
  required_services TEXT[],
  match_score INTEGER,
  is_demo BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH owned_listing AS (
    SELECT l.*
    FROM public.property_listings l
    WHERE l.id = p_listing_id
      AND l.owner_id = auth.uid()
      AND l.status = 'active'
  ), scored AS (
    SELECT
      b.*,
      LEAST(100, GREATEST(0, ROUND(
        35 +
        CASE WHEN lower(trim(b.district)) = lower(trim(l.district)) THEN 20 ELSE 7 END +
        CASE WHEN lower(trim(b.property_type)) = lower(trim(l.property_type)) THEN 15 ELSE 0 END +
        CASE
          WHEN l.price <= b.max_price THEN 15
          WHEN l.price <= b.max_price * 1.10 THEN 8
          WHEN l.price <= b.max_price * 1.20 THEN 3
          ELSE 0
        END +
        CASE
          WHEN l.bedrooms >= b.min_bedrooms THEN 10
          WHEN l.bedrooms = b.min_bedrooms - 1 THEN 4
          ELSE 0
        END +
        CASE
          WHEN cardinality(b.features) = 0 THEN 5
          ELSE 5.0 * (
            SELECT count(*) FROM unnest(b.features) AS wanted(feature)
            WHERE EXISTS (
              SELECT 1 FROM unnest(l.features) AS available(feature)
              WHERE lower(trim(available.feature)) = lower(trim(wanted.feature))
            )
          ) / cardinality(b.features)
        END +
        CASE
          WHEN cardinality(b.required_services) = 0 THEN 5
          ELSE 5.0 * (
            SELECT count(*) FROM unnest(b.required_services) AS wanted(service)
            WHERE EXISTS (
              SELECT 1 FROM unnest(l.required_services) AS available(service)
              WHERE lower(trim(available.service)) = lower(trim(wanted.service))
            )
          ) / cardinality(b.required_services)
        END
      ))::INTEGER) AS calculated_score
    FROM public.buyer_requests b
    CROSS JOIN owned_listing l
    WHERE b.status = 'active'
      AND (b.contact_consent = TRUE OR b.is_demo = TRUE)
      AND lower(trim(b.city)) = lower(trim(l.city))
      AND b.purpose = l.purpose
  )
  SELECT
    id, full_name, phone, city, district, property_type, purpose,
    max_price, min_bedrooms, features, required_services,
    calculated_score AS match_score, is_demo, created_at
  FROM scored
  WHERE calculated_score >= 45
  ORDER BY calculated_score DESC, created_at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.match_buyers_for_property(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_buyers_for_property(UUID) TO authenticated;
