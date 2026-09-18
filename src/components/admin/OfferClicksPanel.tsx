import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MousePointerClick, Ticket, RefreshCw } from "lucide-react";
import { adminOfferClickSummary } from "@/lib/offer-clicks.functions";

const RANGES = [7, 30, 90] as const;

/** شاشة نقرات العروض أو الكوبونات داخل لوحة /admin */
export function OfferClicksPanel({ mode }: { mode: "offer" | "coupon" }) {
  const [days, setDays] = useState<number>(7);
  const fetchSummary = useServerFn(adminOfferClickSummary);

  const q = useQuery({
    queryKey: ["admin-offer-clicks", days],
    queryFn: () => fetchSummary({ data: { days } }),
    refetchInterval: 60_000,
  });

  const isCoupon = mode === "coupon";
  const d = q.data;
  const rows = (d?.recent ?? []).filter((r) => r.kind === mode);
  const top = (d?.topOffers ?? []).filter((r) => r.kind === mode);
  const total = isCoupon ? (d?.coupons ?? 0) : (d?.offers ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black flex items-center gap-2">
          {isCoupon ? (
            <Ticket className="w-5 h-5 text-primary" />
          ) : (
            <MousePointerClick className="w-5 h-5 text-primary" />
          )}
          {isCoupon ? "نقرات الكوبونات" : "نقرات العروض"}
        </h2>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                days === r ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              {r} يوم
            </button>
          ))}
          <button
            onClick={() => q.refetch()}
            className="p-2 rounded-lg bg-muted hover:bg-muted/70"
            aria-label="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${q.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {q.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> جارِ تحميل النقرات...
        </div>
      )}

      {q.isError && (
        <p className="text-sm text-destructive">تعذّر تحميل البيانات. جرّب التحديث.</p>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label={isCoupon ? "نقرات الكوبونات" : "نقرات العروض"} value={total} />
            <Stat label="إجمالي النقرات" value={d.total} />
            <Stat label="جلسات فريدة" value={d.sessions} />
            <Stat label="أماكن العرض" value={d.bySurface.length} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="font-bold text-sm mb-3">
              {isCoupon ? "أكثر الكوبونات نقراً" : "أكثر العروض نقراً"}
            </h3>
            {top.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد نقرات في هذه الفترة.</p>
            ) : (
              <ul className="space-y-2">
                {top.slice(0, 15).map((t) => (
                  <li key={t.offerId} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{t.storeName}</span>
                    <span className="font-bold text-primary shrink-0">{t.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="p-3 text-right">العنوان</th>
                  <th className="p-3 text-right">المتجر</th>
                  {isCoupon && <th className="p-3 text-right">الكود</th>}
                  <th className="p-3 text-right">المكان</th>
                  <th className="p-3 text-right">المدينة</th>
                  <th className="p-3 text-right">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/50">
                    <td className="p-3 max-w-[220px] truncate">{r.offerTitle}</td>
                    <td className="p-3 text-muted-foreground">{r.storeName}</td>
                    {isCoupon && <td className="p-3 font-mono">{r.couponCode ?? "—"}</td>}
                    <td className="p-3 text-muted-foreground">{r.surface}</td>
                    <td className="p-3 text-muted-foreground">{r.city ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("ar-SA")}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                      لا توجد نقرات مسجّلة بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-black text-primary tabular-nums">{value}</div>
    </div>
  );
}
