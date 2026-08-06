import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublishedDeals } from "@/lib/merchant-api";

export const LIVE_DEALS_KEY = ["published-merchant-deals"];

/**
 * العروض الحقيقية أول بأول: اشتراك لحظي (Realtime) + تحديث دوري احتياطي.
 */
export function useLiveDeals(limit = 12) {
  const queryClient = useQueryClient();
  const [live, setLive] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

  const query = useQuery({
    queryKey: LIVE_DEALS_KEY,
    queryFn: () => fetchPublishedDeals(limit),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel("live-merchant-deals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merchant_deals" },
        () => {
          setLastEventAt(Date.now());
          queryClient.invalidateQueries({ queryKey: LIVE_DEALS_KEY });
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { ...query, live, lastEventAt };
}

export function timeAgoAr(iso: string | number | null | undefined) {
  if (!iso) return "";
  const ts = typeof iso === "number" ? iso : new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  return `قبل ${Math.floor(h / 24)} يوم`;
}
