import { createFileRoute, Link } from "@tanstack/react-router";
import { deals, discountPercent, stores } from "@/data/deals";
import { DealCard } from "@/components/DealCard";
import { StoreLogo } from "@/components/StoreLogo";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, BadgeCheck, Store as StoreIcon, Sparkles } from "lucide-react";
import { fetchPublishedDeals } from "@/lib/merchant-api";
import { readPrefs, hasPrefs, type Prefs } from "@/lib/preferences";
import { smartSort } from "@/lib/smart-rank";
import { z } from "zod";


const searchSchema = z.object({
  cat: z.string().optional(),
  store: z.string().optional(),
});

export const Route = createFileRoute("/deals")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "كل العروض - وفّر" },
      { name: "description", content: "استعرض جميع عروض المتاجر السعودية مرتّبة حسب نسبة التوفير." },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { cat, store } = Route.useSearch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>(cat);
  const [storeId, setStoreId] = useState<string | undefined>(store);
  const [sort, setSort] = useState<"smart" | "discount" | "price">("smart");
  const [prefs, setPrefs] = useState<Prefs>({ categories: {}, stores: {} });

  useEffect(() => {
    const load = () => setPrefs(readPrefs());
    load();
    window.addEventListener("hkeeem-prefs-change", load);
    return () => window.removeEventListener("hkeeem-prefs-change", load);
  }, []);

  const filtered = useMemo(() => {
    const list = deals.filter((d) => {
      if (category && d.category !== category) return false;
      if (storeId && d.storeId !== storeId) return false;
      if (q && !d.title.includes(q)) return false;
      return true;
    });
    if (sort === "smart") return smartSort(list, prefs);
    list.sort((a, b) => sort === "discount" ? discountPercent(b) - discountPercent(a) : a.price - b.price);
    return list;
  }, [q, category, storeId, sort, prefs]);


  const cats = ["سوبرماركت", "مطاعم", "إلكترونيات", "صيدلية"];

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-12 space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl">كل العروض</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} عرض متاح الآن</p>
      </div>

      <MerchantDealsSection />

      <div className="relative">

        <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full bg-card border border-border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <Chip active={!category} onClick={() => setCategory(undefined)}>الكل</Chip>
        {cats.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <Chip active={!storeId} onClick={() => setStoreId(undefined)} small>كل المتاجر</Chip>
        {stores.filter(s => !category || s.category === category).map((s) => (
          <Chip key={s.id} active={storeId === s.id} onClick={() => setStoreId(s.id)} small>
            <StoreLogo store={s} size="sm" className="ml-1 w-4 h-4 rounded" />
            {s.name}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground py-1.5">ترتيب:</span>
        <button onClick={() => setSort("smart")} className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold press-ripple transition ${sort==="smart"?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground"}`}>
          <Sparkles className="w-3 h-3" /> ذكي
        </button>
        <button onClick={() => setSort("discount")} className={`px-3 py-1.5 rounded-full font-bold press-ripple transition ${sort==="discount"?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground"}`}>الأعلى توفيراً</button>
        <button onClick={() => setSort("price")} className={`px-3 py-1.5 rounded-full font-bold press-ripple transition ${sort==="price"?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground"}`}>الأرخص سعراً</button>
        {(q || category || storeId) && (
          <button onClick={() => { setQ(""); setCategory(undefined); setStoreId(undefined); }} className="mr-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive font-bold press-ripple transition">
            <X className="w-3 h-3" /> مسح الفلاتر
          </button>
        )}
      </div>

      {sort === "smart" && (
        <p className="text-xs text-muted-foreground -mt-2">
          {hasPrefs(prefs)
            ? "مرتّبة حسب قرب انتهاء العرض ونسبة التوفير واهتماماتك السابقة."
            : "مرتّبة حسب قرب انتهاء العرض ونسبة التوفير — وتتحسّن كلما تصفّحت عروضاً أكثر."}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">لا توجد عروض مطابقة.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((d, i) => <DealCard key={d.id} deal={d} rank={sort==="price"?undefined:i+1} />)}
        </div>
      )}

    </main>
  );
}

/** عروض حقيقية أضافها تجّار موثّقون */
function MerchantDealsSection() {
  const q = useQuery({ queryKey: ["published-merchant-deals"], queryFn: () => fetchPublishedDeals(12) });
  const items = q.data ?? [];
  if (q.isLoading || items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-black text-lg flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-primary" /> عروض حقيقية من التجّار
        </h2>
        <Link to="/merchant" className="text-xs text-primary hover:underline flex items-center gap-1">
          <StoreIcon className="w-3.5 h-3.5" /> أضف عرض متجرك
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((d) => (
          <article key={d.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-card hover-lift">
            {d.image_url && (
              <img src={d.image_url} alt={d.title} loading="lazy" className="w-full h-28 object-cover" />
            )}
            <div className="p-3 space-y-1">
              <p className="font-bold text-sm line-clamp-2">{d.title}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-primary" /> {d.merchants.name}
              </p>
              <p className="text-sm font-black text-primary">
                {d.price} ر.س{" "}
                <span className="text-[11px] font-normal text-muted-foreground line-through">{d.original_price}</span>
              </p>
              <span className="inline-block text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                وفّر {d.discount_percent}%
              </span>
              {d.product_url && (
                <a href={d.product_url} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-primary hover:underline pt-1">
                  اذهب للعرض
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}


function Chip({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full font-bold transition press-ripple ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${active ? "bg-primary text-primary-foreground shadow-soft" : "bg-card border border-border text-foreground hover:border-primary"}`}
    >
      {children}
    </button>
  );
}
