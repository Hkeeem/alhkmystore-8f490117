import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Car, ExternalLink, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "عروض السيارات وأسعارها في السعودية | حكيم" },
      {
        name: "description",
        content:
          "جدول تلقائي لعروض السيارات في السعودية: السعر، الماركة، الموديل، ناقل الحركة والوقود مع فرز وفلترة فورية.",
      },
      { property: "og:title", content: "عروض السيارات وأسعارها | حكيم" },
      {
        property: "og:description",
        content: "قارن عروض السيارات حسب السعر والمواصفات وحدّثها لحظيًا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarsPage,
});

type CarRow = {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  store: string;
  url: string;
  year: string;
  transmission: string;
  fuel: string;
};

const CAR_WORDS = /سيار|مركب|car|vehicle|تويوتا|هونداي|كيا|نيسان|لكزس|فورد|شفروليه|جي ام|هوندا|مازda|مازدا|بي ام|مرسيد/i;

const BRANDS = [
  "تويوتا",
  "هونداي",
  "كيا",
  "نيسان",
  "لكزس",
  "فورد",
  "شفروليه",
  "هوندا",
  "مازدا",
  "مرسيدس",
  "بي ام دبليو",
  "جيب",
];

function specsOf(title: string) {
  const year = title.match(/20\d{2}/)?.[0] ?? "—";
  const transmission = /أوتوم|اوتوم|automatic/i.test(title)
    ? "أوتوماتيك"
    : /عادي|مانيوال|manual/i.test(title)
      ? "عادي"
      : "—";
  const fuel = /هجين|hybrid/i.test(title)
    ? "هجين"
    : /كهرب|electric|ev\b/i.test(title)
      ? "كهربائي"
      : /ديزل|diesel/i.test(title)
        ? "ديزل"
        : "بنزين";
  const brand = BRANDS.find((b) => title.includes(b)) ?? "أخرى";
  return { year, transmission, fuel, brand };
}

async function fetchCars(): Promise<CarRow[]> {
  const [deals, showroom] = await Promise.all([
    supabase
      .from("external_deals")
      .select("id, title, price, original_price, discount_percent, store_name, product_url, category")
      .eq("active", true)
      .limit(400),
    supabase
      .from("showroom_offers")
      .select("id, title, brand, price, original_price, discount_percent, offer_url, category")
      .eq("active", true)
      .limit(200),
  ]);

  const rows: CarRow[] = [];

  for (const d of deals.data ?? []) {
    const text = `${d.title ?? ""} ${d.category ?? ""}`;
    if (!CAR_WORDS.test(text)) continue;
    const s = specsOf(d.title ?? "");
    rows.push({
      id: `d-${d.id}`,
      title: d.title ?? "",
      brand: s.brand,
      price: Number(d.price ?? 0),
      originalPrice: Number(d.original_price ?? 0),
      discount: d.discount_percent ?? 0,
      store: d.store_name ?? "متجر",
      url: d.product_url ?? "#",
      year: s.year,
      transmission: s.transmission,
      fuel: s.fuel,
    });
  }

  for (const o of showroom.data ?? []) {
    const text = `${o.title ?? ""} ${o.category ?? ""} ${o.brand ?? ""}`;
    if (!CAR_WORDS.test(text)) continue;
    const s = specsOf(`${o.brand ?? ""} ${o.title ?? ""}`);
    rows.push({
      id: `s-${o.id}`,
      title: o.title ?? "",
      brand: o.brand || s.brand,
      price: Number(o.price ?? 0),
      originalPrice: Number(o.original_price ?? 0),
      discount: o.discount_percent ?? 0,
      store: o.brand ?? "معرض",
      url: o.offer_url ?? "#",
      year: s.year,
      transmission: s.transmission,
      fuel: s.fuel,
    });
  }

  return rows;
}

const money = (n: number) => `${n.toLocaleString("ar-SA")} ر.س`;

function CarsPage() {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"price" | "discount">("price");

  const carsQ = useQuery({
    queryKey: ["cars-offers"],
    queryFn: fetchCars,
    refetchInterval: 120_000,
  });

  const rows = useMemo(() => {
    const all = carsQ.data ?? [];
    const cap = Number(maxPrice) || Infinity;
    return all
      .filter((c) => (brand === "all" ? true : c.brand === brand))
      .filter((c) => c.price <= cap)
      .filter((c) =>
        q.trim() ? `${c.title} ${c.brand} ${c.store}`.toLowerCase().includes(q.toLowerCase()) : true,
      )
      .sort((a, b) => (sort === "price" ? a.price - b.price : b.discount - a.discount));
  }, [carsQ.data, brand, maxPrice, q, sort]);

  const brands = useMemo(
    () => Array.from(new Set((carsQ.data ?? []).map((c) => c.brand))).sort(),
    [carsQ.data],
  );

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Car className="w-6 h-6 text-primary" />
          عروض السيارات
        </h1>
        <p className="text-sm text-muted-foreground">
          جدول يتحدّث تلقائيًا بعروض السيارات من المتاجر والمعارض — افرز حسب السعر أو نسبة الخصم.
        </p>
      </header>

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالماركة أو الموديل"
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-primary/20 bg-card text-sm"
          />
        </div>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-primary/20 bg-card text-sm"
        >
          <option value="all">كل الماركات</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <input
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="أعلى سعر (ر.س)"
          className="px-3 py-2.5 rounded-xl border border-primary/20 bg-card text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          النتائج: <b className="text-primary">{rows.length}</b>
        </p>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "price" | "discount")}
            className="px-3 py-2 rounded-lg border border-primary/20 bg-card text-sm"
          >
            <option value="price">الأرخص أولًا</option>
            <option value="discount">الأعلى خصمًا</option>
          </select>
          <button
            onClick={() => carsQ.refetch()}
            disabled={carsQ.isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${carsQ.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-primary/20 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-right font-bold">السيارة</th>
              <th className="p-3 text-right font-bold">الماركة</th>
              <th className="p-3 text-right font-bold">الموديل</th>
              <th className="p-3 text-right font-bold">ناقل الحركة</th>
              <th className="p-3 text-right font-bold">الوقود</th>
              <th className="p-3 text-right font-bold">السعر</th>
              <th className="p-3 text-right font-bold">الخصم</th>
              <th className="p-3 text-right font-bold">الرابط</th>
            </tr>
          </thead>
          <tbody>
            {carsQ.isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  جارٍ تحميل عروض السيارات…
                </td>
              </tr>
            )}
            {!carsQ.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  لا توجد عروض سيارات مطابقة حاليًا.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border/60 hover:bg-muted/40">
                <td className="p-3 max-w-[280px] truncate font-medium">{c.title}</td>
                <td className="p-3">{c.brand}</td>
                <td className="p-3">{c.year}</td>
                <td className="p-3">{c.transmission}</td>
                <td className="p-3">{c.fuel}</td>
                <td className="p-3 font-bold text-primary whitespace-nowrap">{money(c.price)}</td>
                <td className="p-3">
                  {c.discount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      {c.discount}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    عرض <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
