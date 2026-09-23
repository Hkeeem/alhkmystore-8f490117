ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS store_url text;

DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_own_or_staff ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "authenticated can read alert settings" ON public.deal_alert_settings;
CREATE POLICY "staff can read alert settings" ON public.deal_alert_settings FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.property_listings; EXCEPTION WHEN others THEN NULL; END;
END $$;