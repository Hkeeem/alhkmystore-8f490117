import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MousePointerClick, RefreshCw } from "lucide-react";

type Row = {
  id: string;
  kind: string;
  offer_id: string;
  offer_title: string | null;
  store_name: string | null;
  coupon_code: string | null;
  surface: string;
  city: string | null;
  created_at: string;
};

const RANGES = [
  { d: 1, label: "اليوم" },
  { d: 7, label: "7 أيام" },
  { d: 30, label: "30 يوم" },
  { d: 90, label: "90 يوم" },
];

const KIND_LABEL: Record<string, string> = { offer: "عرض", coupon: "كوبون", property: "عقار", car: "سيارة" };

export function OfferClicksPanel({ kind }: { kind?: "offer" | "coupon" | "property" | "car" }) {
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState<string>(kind ?? "all");
  const qc = useQueryClient();
  const key = ["offer-clicks", days, filter];

  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      let query = supabase
        .from("offer_clicks")
        .select("id,kind,offer_id,offer_title,store_name,coupon_code,surface,city,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (filter !== "all") query = query.eq("kind", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-offer-clicks")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "offer_clicks" }, () =>
        qc.invalidateQueries({ queryKey: ["offer-clicks"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [qc]);

  const rows = q.data ?? [];
  const top = Object.values(
    rows.reduce<Record<string, { title: string; kind: string; n: number }>>((acc, r) => {
      const k = `${r.kind}:${r.offer_id}`;
      acc[k] ??= { title: r.offer_title || r.coupon_code || r.offer_id, kind: r.kind, n: 0 };
      acc[k].n++;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);
  const counts = { offer: 0, coupon: 0, property: 0, car: 0 } as Record<string, number>;
  rows.forEach((r) => (counts[r.kind] = (counts[r.kind] ?? 0) + 1));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <MousePointerClick className="h-5 w-5 text-primary" /> نقرات العروض
        </h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">مباشر</span>
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
          <button onClick={() => q.refetch()} className="rounded-lg bg-muted px-2" aria-label="تحديث">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!kind && (
        <div className="flex gap-1">
          {["all", "offer", "coupon", "property", "car"].map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-1 text-xs ${filter === k ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}
            >
              {k === "all" ? "الكل" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="إجمالي النقرات" v={rows.length} />
        <Stat label="العروض" v={counts.offer} />
        <Stat label="الكوبونات" v={counts.coupon} />
        <Stat label="العقارات" v={counts.property} />
        <Stat label="السيارات" v={counts.car} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-bold">الأكثر نقراً</h3>
          {top.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">لا توجد نقرات في هذه الفترة.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {top.map((t, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">
                    <span className="text-muted-foreground">[{KIND_LABEL[t.kind] ?? t.kind}]</span> {t.title}
                  </span>
                  <b>{t.n}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-bold">آخر النقرات</h3>
          <ul className="max-h-80 space-y-1 overflow-auto text-xs">
            {rows.slice(0, 50).map((r) => (
              <li key={r.id} className="flex justify-between gap-2 border-b border-border/40 py-1">
                <span className="truncate">
                  {KIND_LABEL[r.kind] ?? r.kind} · {r.offer_title || r.coupon_code || r.offer_id}
                  {r.city ? ` · ${r.city}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("ar-SA")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-black">{v}</p>
    </div>
  );
}
