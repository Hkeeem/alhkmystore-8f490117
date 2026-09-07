import { createFileRoute, Link } from "@tanstack/react-router";
import { discountPercent, stores } from "@/data/deals";
import { DealCard } from "@/components/DealCard";
import { DemoDataBanner } from "@/components/DemoDataBanner";
import { StoreLogo } from "@/components/StoreLogo";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useRealDeals, REAL_DEALS_KEY } from "@/hooks/use-real-deals";
import { readPrefs, hasPrefs, type Prefs } from "@/lib/preferences";
import { smartSort, smartReason, smartExplanation } from "@/lib/smart-rank";
import { HkeeemOffersSection, StoresDirectory } from "@/components/HkeeemOffersSection";
import { HkeeemCatalogSection } from "@/components/HkeeemCatalogSection";
import { DealsFilter, InterestToggle, type DealFilter, type Interest } from "@/components/DealsFilter";
import { MapButton } from "@/components/MapButton";
import { z } from "zod";

/** إخفاء مؤقت لأقسام عروض حكيم إلى أن تعود خدمتها الخارجية للعمل */
const SHOW_HKEEEM_SECTIONS = false;


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
      { property: "og:title", content: "كل العروض — وفّر مع حكيم AI" },
      { property: "og:description", content: "استعرض جميع عروض المتاجر السعودية مرتّبة حسب نسبة التوفير." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/deals" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/deals" }],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { cat, store } = Route.useSearch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>(cat);
  const [storeId, setStoreId] = useState<string | undefined>(store);
  const [sort, setSort] = useState<"smart" | "discount" | "price">("smart");
  const [quickFilter, setQuickFilter] = useState<DealFilter>("الكل");
  const [interest, setInterest] = useState<Interest>("electronics");

  const applyQuickFilter = (f: DealFilter) => {
    setQuickFilter(f);
    if (f === "الكل") { setCategory(undefined); return; }
    if (f === "أرخص اليوم") { setSort("price"); return; }
    if (f === "أكبر توفير") { setSort("discount"); return; }
    setCategory(f);
  };

  const applyInterest = (i: Interest) => {
    setInterest(i);
    const nextCategory = i === "electronics" ? "إلكترونيات" : "سوبرماركت";
    setCategory(nextCategory);
    setQuickFilter(nextCategory as DealFilter);
  };
  const [prefs, setPrefs] = useState<Prefs>({ categories: {}, stores: {} });
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["published-merchant-deals"] });
    await queryClient.invalidateQueries({ queryKey: REAL_DEALS_KEY });
  };

  useEffect(() => {
    const load = () => setPrefs(readPrefs());
    load();
    window.addEventListener("hkeeem-prefs-change", load);
    return () => window.removeEventListener("hkeeem-prefs-change", load);
  }, []);

  const realDealsQuery = useRealDeals(120);
  const realDeals = useMemo(() => realDealsQuery.data ?? [], [realDealsQuery.data]);

  const filtered = useMemo(() => {
    const list = realDeals.filter((d) => {
      if (category && d.category !== category) return false;
      if (storeId && d.storeId !== storeId) return false;
      if (q && !d.title.includes(q)) return false;
      return true;
    });
    if (sort === "smart") return smartSort(list, prefs);
    list.sort((a, b) => sort === "discount" ? discountPercent(b) - discountPercent(a) : a.price - b.price);
    return list;
  }, [q, category, storeId, sort, prefs, realDeals]);




  const cats = ["سوبرماركت", "مطاعم", "إلكترونيات", "صيدلية"];

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-12 space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl">كل العروض</h1>
        <p className="text-sm text-muted-foreground mt-1">{realDealsQuery.isPending ? "جارٍ تحميل العروض…" : `${filtered.length} عرض متاح الآن`}</p>
        <Link
          to="/deals/panda-vs-othaim-comparison"
          className="inline-flex items-center gap-2 mt-3 rounded-2xl border border-border px-3 py-2 text-xs font-black hover:bg-muted/50 transition"
        >
          🆚 عروض بنده مقابل العثيم — مقارنة أسبوعية
        </Link>
      </div>


      {/* أقسام عروض حكيم مخفية مؤقتاً بطلب المالك (خدمة حكيم الخارجية متوقفة) */}
      {SHOW_HKEEEM_SECTIONS ? (
        <>
          <HkeeemCatalogSection />
          <HkeeemOffersSection />
        </>
      ) : (
        /* دليل المتاجر يبقى ظاهراً حتى مع إخفاء أقسام حكيم */
        <StoresDirectory />
      )}


      <div className="relative">

        <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full bg-card border border-border rounded-2xl pr-11 pl-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <DealsFilter activeFilter={quickFilter} onChange={applyQuickFilter} />
        <InterestToggle interest={interest} onChange={applyInterest} />
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

      <DemoDataBanner showDemoData={false} onRefresh={handleRefresh} />



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

      {realDealsQuery.isPending ? (
        <div className="text-center py-20 text-muted-foreground">جارٍ تحميل العروض الحقيقية…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          لا توجد عروض حقيقية مطابقة حالياً — نعرض فقط عروض التجّار الموثّقين.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((d, i) => (
            <DealCard
              key={d.id}
              deal={d}
              rank={sort === "price" ? undefined : i + 1}
              reason={sort === "smart" ? smartReason(d, prefs) ?? "ترتيب ذكي" : null}
              reasonDetail={sort === "smart" ? smartExplanation(d, prefs) : undefined}
            />
          ))}
        </div>
      )}

      <MapButton />
    </main>
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
