CREATE TABLE public.gallery_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  clicks_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_deals TO authenticated;
GRANT ALL ON public.gallery_deals TO service_role;
ALTER TABLE public.gallery_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active gallery deals" ON public.gallery_deals FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage gallery deals" ON public.gallery_deals FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER gallery_deals_updated_at BEFORE UPDATE ON public.gallery_deals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.gallery_deal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.gallery_deals(id) ON DELETE CASCADE,
  view_type text NOT NULL DEFAULT 'view',
  user_id uuid,
  page_path text,
  referrer text,
  user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_deal_views TO authenticated;
GRANT ALL ON public.gallery_deal_views TO service_role;
ALTER TABLE public.gallery_deal_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read deal views" ON public.gallery_deal_views FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_deal_view(p_deal_id uuid, p_view_type text DEFAULT 'view', p_page_path text DEFAULT NULL, p_referrer text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.gallery_deal_views (deal_id, view_type, user_id, page_path, referrer, user_agent)
  VALUES (p_deal_id, left(coalesce(p_view_type,'view'),10), auth.uid(), left(p_page_path,300), left(p_referrer,500), left(p_user_agent,500));
  IF p_view_type = 'click' THEN
    UPDATE public.gallery_deals SET clicks_count = clicks_count + 1 WHERE id = p_deal_id;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.log_deal_view(uuid, text, text, text, text) TO anon, authenticated;