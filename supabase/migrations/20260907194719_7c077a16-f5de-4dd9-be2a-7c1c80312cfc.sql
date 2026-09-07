ALTER TABLE public.merchant_deals DISABLE TRIGGER merchant_deals_guard;
UPDATE public.merchant_deals
SET starts_at = now() - interval '1 day',
    expires_at = now() + interval '30 days',
    updated_at = now()
WHERE status = 'published';
ALTER TABLE public.merchant_deals ENABLE TRIGGER merchant_deals_guard;