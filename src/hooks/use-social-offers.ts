import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SocialOffer = {
  id: string;
  platform: string;
  handle: string;
  title: string;
  description: string | null;
  image_url: string | null;
  post_url: string | null;
  coupon_code: string | null;
  original_price: number | null;
  price: number | null;
  discount_percent: number | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  expires_at: string | null;
};

export const SOCIAL_OFFERS_KEY = ["social-offers"] as const;

export async function fetchSocialOffers(limit = 60): Promise<SocialOffer[]> {
  const { data, error } = await supabase
    .from("social_offers")
    .select(
      "id, platform, handle, title, description, image_url, post_url, coupon_code, original_price, price, discount_percent, city, lat, lng, expires_at",
    )
    .eq("active", true)
    .order("expires_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SocialOffer[];
}

export function useSocialOffers(limit = 60) {
  return useQuery({
    queryKey: [...SOCIAL_OFFERS_KEY, limit],
    queryFn: () => fetchSocialOffers(limit),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
