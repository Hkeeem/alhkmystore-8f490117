import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHkeeemIntegrationStatus } from "@/lib/hkeeem-offers.functions";
import { REAL_DEALS_KEY } from "@/hooks/use-real-deals";

/**
 * يتحقق دورياً من خدمة حكيم الخارجية.
 * عند عودتها للعمل تظهر أقسام «عروض HkeeemAI المعتمدة» تلقائياً،
 * وتُحدَّث العروض والخريطة فوراً.
 */
export function useHkeeemAvailability() {
  const fetchStatus = useServerFn(getHkeeemIntegrationStatus);
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["hkeeem-status"],
    queryFn: () => fetchStatus({}),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const status = statusQuery.data;
  const lastSuccess = status?.lastSuccessAt ? new Date(status.lastSuccessAt).getTime() : null;
  const lastFailure = status?.lastFailureAt ? new Date(status.lastFailureAt).getTime() : null;
  const available = Boolean(
    status?.configured && lastSuccess !== null && (lastFailure === null || lastSuccess >= lastFailure),
  );

  const prev = useRef<boolean | null>(null);
  useEffect(() => {
    if (statusQuery.isPending) return;
    if (prev.current === null) {
      prev.current = available;
      return;
    }
    if (prev.current !== available) {
      prev.current = available;
      if (available) {
        // عادت الخدمة: حدّث كل مصادر العروض والخريطة
        void queryClient.invalidateQueries({ queryKey: REAL_DEALS_KEY, refetchType: "all" });
        void queryClient.invalidateQueries({ queryKey: ["hkeeem-offers"], refetchType: "all" });
        void queryClient.invalidateQueries({ queryKey: ["hkeeem-catalog"], refetchType: "all" });
        void queryClient.invalidateQueries({ queryKey: ["published-merchant-deals"], refetchType: "all" });
      }
    }
  }, [available, statusQuery.isPending, queryClient]);

  return { available, isPending: statusQuery.isPending, status };
}
