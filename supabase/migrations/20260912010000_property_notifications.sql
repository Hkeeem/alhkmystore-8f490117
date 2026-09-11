CREATE OR REPLACE FUNCTION public.notify_new_property_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    SELECT
      u.id,
      'عقار جديد في مكتب حكيم',
      NEW.title || ' — ' || NEW.city || '، ' || NEW.district,
      '/office#property-' || NEW.id::text
    FROM auth.users AS u
    WHERE u.id <> NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_listing_new_notification ON public.property_listings;
CREATE TRIGGER property_listing_new_notification
AFTER INSERT OR UPDATE OF status ON public.property_listings
FOR EACH ROW EXECUTE FUNCTION public.notify_new_property_listing();

GRANT EXECUTE ON FUNCTION public.notify_new_property_listing() TO service_role;
