import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Store } from "lucide-react";

type Row = {
  id: string;
  kind: string;
  offer_id: string;
  offer_title: string | null;
  store_name: string | null;
  store_id: string | null;
  surface: string;
  created_at: string;
};

const RANGES = [
  { d: 1, label: "اليوم" },
  { d: 7, label: "7 أيام" },
  { d: 30, label: "30 يوم" },
  { d: 90, label: "90 يوم" },
];

/** زيارات المتاجر: عدد الزيارات لكل متجر عبر روابط مواقعه داخل العروض */
export function StoreVisitsPanel() {
  const [days, setDays] = useState(7);

  const q = useQuery({
    queryKey: ["store-visits", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await supabase
        .from("offer_clicks")
        .select("id,kind,offer_id,offer_title,store_name,store_id,surface,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const stores = useMemo(() => {
    const rows = q.data ?? [];
    const m = new Map<
      string,
      { name: string; storeId: string | null; visits: number; websiteClicks: number; offers: Set<string> }
    >();
    for (const r of rows) {
      const key = r.store_name || r.store_id || "غير معروف";
      const entry =
        m.get(key) ??
        { name: key, storeId: r.store_id, visits: 0, websiteClicks: 0, offers: new Set<string>() };
      entry.visits++;
      if (r.surface === "store-website") entry.websiteClicks++;
      entry.offers.add(r.offer_id);
      m.set(key, entry);
    }
    return [...m.values()].sort((a, b) => b.visits - a.visits);
  }, [q.data]);

  const total = (q.data ?? []).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Store className="h-5 w-5 text-primary" /> زيارات المتاجر
        </h2>
        <div className="ms-auto flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.d}
              onClick={() => setDays(r.d)}
              className={`rounded-lg px-3 py-1 text-xs ${days === r.d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {r.label}
            </button>
          ))}
          <button onClick={() => q.refetch()} className="rounded-lg bg-muted px-3 py-1 text-xs flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-black text-primary">{total}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">إجمالي النقرات</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-black text-primary">
            {stores.reduce((a, s) => a + s.websiteClicks, 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">زيارات روابط المواقع</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-black text-primary">{stores.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">متجر حصل على زيارات</div>
        </div>
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">جارِ التحميل…</p>}
      {!q.isLoading && stores.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          لا توجد زيارات مسجلة في هذه الفترة بعد. تُسجَّل الزيارة عندما يفتح المستخدم رابط موقع المتجر من
          داخل العروض.
        </p>
      )}

      {stores.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">المتجر</th>
                <th className="p-3 text-center">إجمالي النقرات</th>
                <th className="p-3 text-center">زيارات رابط الموقع</th>
                <th className="p-3 text-center">عروض مختلفة</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={`${s.name}-${s.storeId ?? ""}`} className="border-t border-border/60">
                  <td className="p-3 font-bold">
                    <span className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                      {s.name}
                    </span>
                  </td>
                  <td className="p-3 text-center font-black text-primary">{s.visits}</td>
                  <td className="p-3 text-center">{s.websiteClicks}</td>
                  <td className="p-3 text-center">{s.offers.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
