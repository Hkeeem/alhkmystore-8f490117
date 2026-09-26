import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type CarOffer = {
  id: string;
  title: string;
  brand: string | null;
  store: string | null;
  price: number | null;
  originalPrice: number | null;
  discount: number;
  image: string | null;
  url: string | null;
  city: string | null;
};

const CAR_MATCH = "%سيار%";

async function fetchCarOffers(): Promise<CarOffer[]> {
  const [external, showroom] = await Promise.all([
    supabase
      .from("external_deals")
      .select(
        "id,title,brand,store_name,price,original_price,discount_percent,image_url,product_url,category",
      )
      .eq("active", true)
      .or(`category.ilike.${CAR_MATCH},title.ilike.${CAR_MATCH}`)
      .order("discount_percent", { ascending: false })
      .limit(120),
    supabase
      .from("showroom_offers")
      .select(
        "id,title,brand,price,original_price,discount_percent,image_url,offer_url,city,category",
      )
      .eq("active", true)
      .or(`category.ilike.${CAR_MATCH},title.ilike.${CAR_MATCH}`)
      .order("discount_percent", { ascending: false })
      .limit(120),
  ]);

  const a: CarOffer[] = (external.data ?? []).map((d) => ({
    id: `ext-${d.id}`,
    title: d.title,
    brand: d.brand ?? null,
    store: d.store_name ?? null,
    price: d.price ?? null,
    originalPrice: d.original_price ?? null,
    discount: d.discount_percent ?? 0,
    image: d.image_url ?? null,
    url: d.product_url ?? null,
    city: null,
  }));

  const b: CarOffer[] = (showroom.data ?? []).map((d) => ({
    id: `shr-${d.id}`,
    title: d.title,
    brand: d.brand ?? null,
    store: d.brand ?? null,
    price: d.price ?? null,
    originalPrice: d.original_price ?? null,
    discount: d.discount_percent ?? 0,
    image: d.image_url ?? null,
    url: d.offer_url ?? null,
    city: d.city ?? null,
  }));

  return [...a, ...b];
}

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "عروض السيارات في السعودية — Hkeeem AI" },
      {
        name: "description",
        content:
          "جدول تلقائي يجمع عروض السيارات من الوكالات والمعارض السعودية مرتبة حسب السعر والمواصفات.",
      },
      { property: "og:title", content: "عروض السيارات في السعودية — Hkeeem AI" },
      {
        property: "og:description",
        content: "قارن عروض السيارات من الوكالات والمعارض السعودية في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarsPage,
});

function riyal(n: number | null) {
  if (n == null) return "—";
  return `${n.toLocaleString("ar-SA")} ر.س`;
}

function CarsPage() {
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const query = useQuery({
    queryKey: ["car-offers"],
    queryFn: fetchCarOffers,
    staleTime: 60_000,
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const cap = Number(maxPrice) || Infinity;
    return (query.data ?? [])
      .filter(
        (r) =>
          (!term ||
            r.title.toLowerCase().includes(term) ||
            (r.brand ?? "").toLowerCase().includes(term)) &&
          (r.price ?? 0) <= cap,
      )
      .sort((x, y) => (x.price ?? Infinity) - (y.price ?? Infinity));
  }, [query.data, q, maxPrice]);

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Car className="w-6 h-6 text-primary" /> عروض السيارات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          جدول يُحدَّث تلقائيًا بعروض السيارات من الوكالات والمعارض السعودية، مرتبة من الأوفر
          سعرًا.
        </p>
      </header>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالماركة أو الموديل"
            className="pr-9"
          />
        </div>
        <Input
          value={maxPrice}
          inputMode="numeric"
          onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
          placeholder="أعلى سعر (ر.س)"
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          لا توجد عروض سيارات منشورة حاليًا — البوتات تجلب العروض تلقائيًا فور توفّرها.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="p-3 text-right">السيارة</th>
                <th className="p-3 text-right">الجهة</th>
                <th className="p-3 text-right">السعر</th>
                <th className="p-3 text-right">قبل الخصم</th>
                <th className="p-3 text-right">الخصم</th>
                <th className="p-3 text-right">الرابط</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {r.image && (
                        <img
                          src={r.image}
                          alt={r.title}
                          loading="lazy"
                          className="h-10 w-14 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold">{r.title}</p>
                        {r.brand && (
                          <p className="truncate text-xs text-muted-foreground">{r.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.store ?? "—"}
                    {r.city ? ` — ${r.city}` : ""}
                  </td>
                  <td className="p-3 font-bold text-primary">{riyal(r.price)}</td>
                  <td className="p-3 text-xs text-muted-foreground line-through">
                    {riyal(r.originalPrice)}
                  </td>
                  <td className="p-3">
                    {r.discount > 0 ? <Badge>{r.discount}%</Badge> : <span>—</span>}
                  </td>
                  <td className="p-3">
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        عرض <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
