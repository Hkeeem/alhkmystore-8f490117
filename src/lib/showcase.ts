import { supabase } from "@/integrations/supabase/client";

export type ShowroomOffer = {
  id: string;
  brand: string;
  title: string;
  description: string | null;
  image_url: string | null;
  offer_url: string | null;
  category: string;
  city: string | null;
  original_price: number | null;
  price: number | null;
  discount_percent: number;
  fetched_at: string;
};

export type HarajListing = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  post_url: string;
  price: number | null;
  city: string | null;
  author: string | null;
  posted_at: string | null;
  fetched_at: string;
};

export type OfficePick = {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  price: number | null;
  city: string | null;
  rank: number;
};

export async function fetchShowroomOffers(limit = 24): Promise<ShowroomOffer[]> {
  const { data, error } = await supabase
    .from("showroom_offers")
    .select(
      "id, brand, title, description, image_url, offer_url, category, city, original_price, price, discount_percent, fetched_at",
    )
    .eq("active", true)
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ShowroomOffer[];
}

export async function fetchHarajListings(limit = 5): Promise<HarajListing[]> {
  const { data, error } = await supabase
    .from("haraj_listings")
    .select("id, title, description, image_url, post_url, price, city, author, posted_at, fetched_at")
    .eq("active", true)
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as HarajListing[];
}

export async function fetchOfficePicks(kind: "property" | "developer", limit = 5): Promise<OfficePick[]> {
  const { data, error } = await supabase
    .from("office_picks")
    .select("id, kind, title, subtitle, image_url, link_url, price, city, rank")
    .eq("active", true)
    .eq("kind", kind)
    .order("rank", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as OfficePick[];
}
