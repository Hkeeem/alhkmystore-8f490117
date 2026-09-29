import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StoreBranch = Pick<
  Database["public"]["Tables"]["store_branches"]["Row"],
  | "id"
  | "store_id"
  | "store_name"
  | "name"
  | "city"
  | "district"
  | "address"
  | "lat"
  | "lng"
  | "maps_url"
  | "image_url"
>;

export const STORE_BRANCHES_KEY = ["active-store-branches"] as const;

export async function fetchActiveStoreBranches(): Promise<StoreBranch[]> {
  const { data, error } = await supabase
    .from("store_branches")
    .select("id, store_id, store_name, name, city, district, address, lat, lng, maps_url, image_url")
    .eq("is_active", true)
    .order("store_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useStoreBranches() {
  return useQuery({
    queryKey: STORE_BRANCHES_KEY,
    queryFn: fetchActiveStoreBranches,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}