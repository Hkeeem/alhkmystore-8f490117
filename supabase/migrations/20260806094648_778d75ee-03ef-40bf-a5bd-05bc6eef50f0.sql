DO $$
DECLARE r record; d jsonb;
BEGIN
  SELECT * INTO r FROM public.merchant_deals WHERE id='d20376aa-46f2-4b1f-a022-5cb7a93079f9';
  SELECT jsonb_object_agg(k, v) INTO d
  FROM jsonb_each(to_jsonb(r)) AS a(k,v)
  WHERE k IN ('clicks','updated_at','status','discount_percent');
  RAISE NOTICE 'row: %', d;
END $$;