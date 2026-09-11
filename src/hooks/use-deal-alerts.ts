import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRealDeals } from "@/hooks/use-real-deals";
import { fetchLiveCoupons } from "@/lib/coupons-api";

const SEEN_EXPIRING = "hkeeem-alert-expiring";
const SEEN_COUPONS = "hkeeem-alert-coupons";
const DAY_MS = 24 * 60 * 60 * 1000;

function readSeen(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSeen(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(-200)));
  } catch {
    /* ignore */
  }
}

/**
 * إشعارات داخل التطبيق:
 * - عرض ينتهي خلال أقل من 24 ساعة (آخر يوم).
 * - كوبون جديد لم يُعرض على المستخدم من قبل.
 */
export function useDealAlerts() {
  const dealsQ = useRealDeals();
  const couponsQ = useQuery({
    queryKey: ["live-coupons"],
    queryFn: () => fetchLiveCoupons(60),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // عروض في يومها الأخير
  useEffect(() => {
    const deals = dealsQ.data ?? [];
    if (deals.length === 0) return;
    const now = Date.now();
    const seen = readSeen(SEEN_EXPIRING);
    const fresh = deals.filter((d) => {
      if (!d.expiresAt) return false;
      const left = new Date(d.expiresAt).getTime() - now;
      return left > 0 && left <= DAY_MS && !seen.includes(d.id);
    });
    if (fresh.length === 0) return;

    const first = fresh[0]!;
    toast.warning(
      fresh.length === 1
        ? `⏰ آخر يوم لعرض: ${first.title}`
        : `⏰ ${fresh.length} عروض تنتهي خلال 24 ساعة`,
      { description: "افتح صفحة العروض قبل انتهائها.", duration: 6000 },
    );
    writeSeen(SEEN_EXPIRING, [...seen, ...fresh.map((d) => d.id)]);
  }, [dealsQ.data]);

  // كوبونات جديدة
  useEffect(() => {
    const coupons = couponsQ.data ?? [];
    if (coupons.length === 0) return;
    const seen = readSeen(SEEN_COUPONS);
    const isFirstRun = seen.length === 0;
    const fresh = coupons.filter((c) => !seen.includes(c.id));
    if (fresh.length === 0) return;

    if (!isFirstRun) {
      const first = fresh[0]!;
      toast.success(
        fresh.length === 1
          ? `🎟️ كوبون جديد: ${first.storeName} — ${first.code}`
          : `🎟️ ${fresh.length} كوبونات جديدة متاحة الآن`,
        { description: "افتح صفحة الكوبونات لنسخ الكود.", duration: 6000 },
      );
    }
    writeSeen(SEEN_COUPONS, [...seen, ...fresh.map((c) => c.id)]);
  }, [couponsQ.data]);
}
