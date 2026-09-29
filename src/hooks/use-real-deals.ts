import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchRealDeals } from "@/lib/real-deals";

export const REAL_DEALS_KEY = ["real-deals"];

/** كل العروض الحقيقية (تجّار موثّقون + مصادر خارجية نشطة) */
export function useRealDeals(limit = 120) {
  return useQuery({
    queryKey: [...REAL_DEALS_KEY, limit],
    queryFn: () => fetchRealDeals(limit),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
    placeholderData: keepPreviousData,
  });
}
