import { createFileRoute } from "@tanstack/react-router";
import { deals, discountPercent, stores } from "@/data/deals";
import { DealCard } from "@/components/DealCard";
import { StoreLogo } from "@/components/StoreLogo";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  cat: z.string().optional(),
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
  const { cat } = Route.useSearch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>(cat);
  const [storeId, setStoreId] = useState<string | undefined>();
  const [sort, setSort] = useState<"discount" | "price">("discount");

  const filtered = useMemo(() => {
    let list = deals.filter((d) => {
      if (category && d.category !== category) return false;
      if (storeId && d.storeId !== storeId) return false;
      if (q && !d.title.includes(q)) return false;
      return true;
    });
    list.sort((a, b) => sort === "discount" ? discountPercent(b) - discountPercent(a) : a.price - b.price);
    return list;
  }, [q, category, storeId, sort]);

  const cats = ["سوبرماركت", "مطاعم", "إلكترونيات", "صيدلية"];

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-12 space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl">كل العروض</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} عرض متاح الآن</p>
      </div>

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

      <div className="flex items-center gap-2 text-xs">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground py-1.5">ترتيب:</span>
        <button onClick={() => setSort("discount")} className={`px-3 py-1.5 rounded-full font-bold press-ripple transition ${sort==="discount"?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground"}`}>الأعلى توفيراً</button>
        <button onClick={() => setSort("price")} className={`px-3 py-1.5 rounded-full font-bold press-ripple transition ${sort==="price"?"bg-primary text-primary-foreground":"bg-secondary text-secondary-foreground"}`}>الأرخص سعراً</button>
        {(q || category || storeId) && (
          <button onClick={() => { setQ(""); setCategory(undefined); setStoreId(undefined); }} className="mr-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive font-bold press-ripple transition">
            <X className="w-3 h-3" /> مسح الفلاتر
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">لا توجد عروض مطابقة.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((d, i) => <DealCard key={d.id} deal={d} rank={sort==="discount"?i+1:undefined} />)}
        </div>
      )}
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
