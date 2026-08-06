ALTER TABLE public.merchant_deals REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'merchant_deals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_deals;
  END IF;
END $$;