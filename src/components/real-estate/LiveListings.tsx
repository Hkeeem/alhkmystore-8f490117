import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Building2, Loader2, MapPin, RefreshCw, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type PublicListing = {
  id: string;
  title: string;
  purpose: string;
  city: string;
  district: string;
  property_type: string;
  price: number;
  bedrooms: number;
  features: string[];
  created_at: string;
};

const CITIES = ["الكل", "الرياض", "جدة", "مكة المكرمة"] as const;

async function fetchPublicListings(): Promise<PublicListing[]> {
  const { data, error } = await supabase
    .from("property_listings")
    .select("id,title,purpose,city,district,property_type,price,bedrooms,features,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    ...r,
    price: Number(r.price),
    bedrooms: Number(r.bedrooms),
    features: r.features ?? [],
  })) as PublicListing[];
}

const sar = (n: number) => new Intl.NumberFormat("ar-SA").format(Math.round(n));

/** أحدث العروض العقارية الحقيقية مع حاسبة العائد الإيجاري */
export function LiveListings() {
  const [city, setCity] = useState<(typeof CITIES)[number]>("الكل");
  const [purpose, setPurpose] = useState<"الكل" | "شراء" | "إيجار">("الكل");
  const [selected, setSelected] = useState<PublicListing | null>(null);
  const [annualRent, setAnnualRent] = useState("");

  const q = useQuery({
    queryKey: ["public-property-listings"],
    queryFn: fetchPublicListings,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const listings = useMemo(() => {
    const all = q.data ?? [];
    return all.filter((l) => {
      if (city !== "الكل" && !l.city.includes(city.replace(" المكرمة", ""))) return false;
      if (purpose !== "الكل" && l.purpose !== purpose) return false;
      return true;
    });
  }, [q.data, city, purpose]);

  const rent = Number(annualRent);
  const price = selected?.price ?? 0;
  const yieldPct = price > 0 && rent > 0 ? (rent / price) * 100 : null;
  const payback = yieldPct ? 100 / yieldPct : null;

  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black">أحدث العروض العقارية</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            عروض حقيقية للبيع والإيجار في الرياض وجدة ومكة، محدّثة من قاعدة البيانات.
          </p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="shrink-0 rounded-2xl border border-border px-3 py-2 text-xs font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${q.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CITIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCity(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${city === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {c}
          </button>
        ))}
        <span className="mx-1 w-px bg-border" />
        {(["الكل", "شراء", "إيجار"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPurpose(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${purpose === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل العروض العقارية…
        </div>
      ) : q.isError ? (
        <p className="py-6 text-center text-sm text-destructive">
          تعذّر تحميل العروض العقارية، حاول مرة أخرى.
        </p>
      ) : listings.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          لا توجد عروض عقارية مطابقة حالياً.
        </p>
      ) : (
        <ul className="space-y-2">
          {listings.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setSelected(l)}
                className={`w-full rounded-2xl border p-3 text-right transition ${selected?.id === l.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{l.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {l.city} · {l.district}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {l.property_type}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3 w-3" /> {l.bedrooms} غرف
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <div className="font-display text-base font-black text-primary">
                      {sar(l.price)} ر.س
                    </div>
                    <div className="text-[10px] text-muted-foreground">{l.purpose}</div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl bg-secondary/60 p-4">
        <h3 className="flex items-center gap-2 text-sm font-black">
          <WalletCards className="h-4 w-4 text-primary" /> حاسبة العائد الإيجاري
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {selected ? `العقار المختار: ${selected.title}` : "اختر عقاراً من القائمة أعلاه."}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-bold">
            سعر العقار (ر.س)
            <input
              readOnly
              value={selected ? sar(selected.price) : ""}
              placeholder="—"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="text-xs font-bold">
            الإيجار السنوي المتوقع (ر.س)
            <input
              inputMode="numeric"
              value={annualRent}
              onChange={(e) => setAnnualRent(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="مثال: 60000"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
        </div>
        {yieldPct !== null && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-black">
            <span className="rounded-xl bg-primary/10 px-3 py-2 text-primary">
              العائد السنوي: {yieldPct.toFixed(2)}%
            </span>
            <span className="rounded-xl bg-secondary px-3 py-2">
              استرداد رأس المال: {payback!.toFixed(1)} سنة
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
