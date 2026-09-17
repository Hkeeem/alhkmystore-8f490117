import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Search, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "عروض المطاعم وخصومات التوصيل في السعودية | حكيم" },
      {
        name: "description",
        content:
          "جدول تلقائي لعروض المطاعم والمقاهي والوجبات في السعودية: السعر، التصنيف، نسبة الخصم والمطعم مع بحث وفلترة فورية.",
      },
      { property: "og:title", content: "عروض المطاعم وخصومات التوصيل | حكيم" },
      {
        property: "og:description",
        content: "قارن عروض المطاعم والمقاهي حسب السعر والتصنيف وحدّثها لحظيًا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RestaurantsPage,
});

type FoodRow = {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  store: string;
  url: string;
};

const FOOD_WORDS =
  /مطعم|مطاعم|وجب|برجر|بيتزا|شاورما|دجاج|قهو|كوفي|كافيه|حلوي|حلويات|مشاوي|بوفيه|إفطار|افطار|عشاء|غداء|توصيل طعام|restaurant|burger|pizza|coffee|cafe|food|meal|هنقرستيشن|جاهز|طلبات|شاي|عصير/i;

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/برجر|burger/i, "برجر"],
  [/بيتزا|pizza/i, "بيتزا"],
  [/شاورما|مشاوي|دجاج|grill/i, "مشاوي ودجاج"],
  [/قهو|كوفي|كافيه|coffee|cafe|شاي|عصير/i, "قهوة ومشروبات"],
  [/حلوي|حلويات|كيك|dessert/i, "حلويات"],
  [/إفطار|افطار|breakfast/i, "إفطار"],
];

function categoryOf(text: string) {
  for (const [re, label] of CATEGORY_RULES) if (re.test(text)) return label;
  return "وجبات عامة";
}

async function fetchFood(): Promise<FoodRow[]> {
  const [deals, merchant] = await Promise.all([
    supabase
      .from("external_deals")
      .select("id, title, price, original_price, discount_percent, store_name, product_url, category")
      .eq("active", true)
      .limit(400),
    supabase
      .from("merchant_deals")
      .select("id, title, price, original_price, discount_percent, store_name, product_url, category")
      .limit(400),
  ]);

  const rows: FoodRow[] = [];

  const push = (
    prefix: string,
    r: {
      id: string;
      title: string | null;
      category: string | null;
      price: number | null;
      original_price: number | null;
      discount_percent: number | null;
      store_name: string | null;
      product_url: string | null;
    },
  ) => {
    const text = `${r.title ?? ""} ${r.category ?? ""} ${r.store_name ?? ""}`;
    if (!FOOD_WORDS.test(text)) return;
    rows.push({
      id: `${prefix}-${r.id}`,
      title: r.title ?? "",
      category: categoryOf(text),
      price: Number(r.price ?? 0),
      originalPrice: Number(r.original_price ?? 0),
      discount: r.discount_percent ?? 0,
      store: r.store_name ?? "مطعم",
      url: r.product_url ?? "#",
    });
  };

  for (const d of deals.data ?? []) push("e", d as never);
  for (const m of merchant.data ?? []) push("m", m as never);

  return rows;
}

const money = (n: number) => `${n.toLocaleString("ar-SA")} ر.س`;

function RestaurantsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"price" | "discount">("price");

  const foodQ = useQuery({
    queryKey: ["restaurant-offers"],
    queryFn: fetchFood,
    refetchInterval: 120_000,
  });

  const rows = useMemo(() => {
    const all = foodQ.data ?? [];
    const cap = Number(maxPrice) || Infinity;
    return all
      .filter((f) => (category === "all" ? true : f.category === category))
      .filter((f) => f.price <= cap)
      .filter((f) =>
        q.trim() ? `${f.title} ${f.store} ${f.category}`.toLowerCase().includes(q.toLowerCase()) : true,
      )
      .sort((a, b) => (sort === "price" ? a.price - b.price : b.discount - a.discount));
  }, [foodQ.data, category, maxPrice, q, sort]);

  const categories = useMemo(
    () => Array.from(new Set((foodQ.data ?? []).map((f) => f.category))).sort(),
    [foodQ.data],
  );

  return (
    <div dir="rtl" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          عروض المطاعم
        </h1>
        <p className="text-sm text-muted-foreground">
          جدول يتحدّث تلقائيًا بعروض المطاعم والمقاهي — ابحث وافرز حسب السعر أو نسبة الخصم.
        </p>
      </header>

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم المطعم أو الوجبة"
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-primary/20 bg-card text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-primary/20 bg-card text-sm"
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
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
            onClick={() => foodQ.refetch()}
            disabled={foodQ.isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/25 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${foodQ.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-primary/20 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-right font-bold">العرض</th>
              <th className="p-3 text-right font-bold">المطعم</th>
              <th className="p-3 text-right font-bold">التصنيف</th>
              <th className="p-3 text-right font-bold">السعر</th>
              <th className="p-3 text-right font-bold">قبل الخصم</th>
              <th className="p-3 text-right font-bold">الخصم</th>
              <th className="p-3 text-right font-bold">الرابط</th>
            </tr>
          </thead>
          <tbody>
            {foodQ.isLoading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  جارٍ تحميل عروض المطاعم…
                </td>
              </tr>
            )}
            {!foodQ.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  لا توجد عروض مطاعم مطابقة حاليًا.
                </td>
              </tr>
            )}
            {rows.map((f) => (
              <tr key={f.id} className="border-t border-border/60 hover:bg-muted/40">
                <td className="p-3 max-w-[280px] truncate font-medium">{f.title}</td>
                <td className="p-3">{f.store}</td>
                <td className="p-3">{f.category}</td>
                <td className="p-3 font-bold text-primary whitespace-nowrap">{money(f.price)}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">
                  {f.originalPrice > 0 ? money(f.originalPrice) : "—"}
                </td>
                <td className="p-3">
                  {f.discount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      {f.discount}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  <a
                    href={f.url}
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
