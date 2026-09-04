import { useQuery } from "@tanstack/react-query";
import { fetchRealDeals } from "@/lib/real-deals";

export const REAL_DEALS_KEY = ["real-deals"];

/** كل العروض الحقيقية (تجّار موثّقون + مصادر خارجية نشطة) */
export function useRealDeals(limit = 120) {
  return useQuery({
    queryKey: [...REAL_DEALS_KEY, limit],
    queryFn: () => fetchRealDeals(limit),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
