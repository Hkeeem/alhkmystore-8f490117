GRANT SELECT ON public.property_listings TO anon;
CREATE POLICY "Public can read active property listings"
ON public.property_listings FOR SELECT TO anon, authenticated
USING (status = 'active');