import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, TrendingDown, RefreshCw, Copy, Check, ShieldCheck, Truck } from "lucide-react";
import {
  bestOffer,
  finalPrice,
  getRetailer,
  priceCategories,
  searchProducts,
  sortedOffers,
  type PriceCategory,
} from "@/data/price-index";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "محرك مقارنة الأسعار — حكيم AI" },
      {
        name: "description",
        content:
          "مقارنة لحظية لأسعار الأجهزة والإلكترونيات والمنتجات الوطنية بين نون وأمازون وجرير وإكسترا ومتجر حكيم المباشر مع أكواد خصم إضافية.",
      },
      { property: "og:title", content: "محرك مقارنة الأسعار — حكيم AI" },
      {
        property: "og:description",
        content: "قارن الأسعار شاملة الضريبة بين أكبر المتاجر السعودية واحصل على كود خصم إضافي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<PriceCategory | "الكل">("الكل");
  const [stockOnly, setStockOnly] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  const results = useMemo(() => {
    const list = searchProducts(q, cat);
    return stockOnly ? list.filter((p) => p.offers.some((o) => o.inStock)) : list;
  }, [q, cat, stockOnly]);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    toast.success(`تم نسخ الكود ${code}`);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <header className="rounded-[2rem] bg-gradient-hero text-primary-foreground p-6 md:p-9 shadow-glow relative overflow-hidden">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-primary/30 text-xs font-bold mb-4">
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            محدث لحظياً ·{" "}
            {updatedAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-black">
            محرك مقارنة الأسعار والعروض
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-white/80 leading-relaxed">
            مقارنة لحظية لأسعار الأجهزة، الإلكترونيات والمنتجات الوطنية بين نون، أمازون، جرير،
            إكسترا ومتجر حكيم المباشر مع توفير كود خصم إضافي.
          </p>

          <div className="mt-6 flex items-center gap-2 bg-white/95 rounded-2xl p-2 border border-primary/20">
            <Search className="w-5 h-5 text-primary mr-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن منتج… مثلاً: آيفون، تلفزيون، تمر"
              aria-label="بحث في مقارنة الأسعار"
              className="flex-1 bg-transparent outline-none text-secondary placeholder:text-secondary/50 py-2 text-sm md:text-base"
            />
            <button
              onClick={() => setUpdatedAt(new Date())}
              className="inline-flex items-center gap-1.5 bg-gradient-gold text-secondary font-bold px-4 py-2.5 rounded-xl hover:opacity-95 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">تحديث</span>
            </button>
          </div>
        </div>
      </header>

      {/* فلاتر */}
      <div className="flex flex-wrap items-center gap-2">
        {(["الكل", ...priceCategories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              cat === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:border-primary/50"
            }`}
          >
            {c}
          </button>
        ))}
        <label className="ms-auto flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={(e) => setStockOnly(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          المتوفر فقط
        </label>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Badge icon={<ShieldCheck className="w-3.5 h-3.5" />} text="شامل ضريبة القيمة المضافة" />
        <Badge icon={<Truck className="w-3.5 h-3.5" />} text="سبل وسمسا · 24-48 ساعة" />
        <Badge icon={<TrendingDown className="w-3.5 h-3.5" />} text="الأرخص بعد الكود أولاً" />
      </div>

      {results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-16">
          لا يوجد حالياً منتج مطابق لبحثك.
        </p>
      )}

      <div className="space-y-4">
        {results.map((p) => {
          const offers = sortedOffers(p);
          const best = bestOffer(p);
          const bestFinal = finalPrice(best);
          return (
            <article
              key={p.id}
              className="bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-l from-primary/10 to-transparent flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold truncate">{p.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {p.brand}
                    {p.unit ? ` · ${p.unit}` : ""} · {p.category}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-[10px] text-muted-foreground">أفضل سعر بعد الكود</div>
                  <div className="font-display font-black text-lg text-gold-shine">
                    {bestFinal} ر.س
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border/50">
                {offers.map((o, i) => {
                  const r = getRetailer(o.retailerId);
                  const fp = finalPrice(o);
                  const diff = fp - bestFinal;
                  return (
                    <div key={o.retailerId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span
                        className="w-2.5 h-8 rounded-full shrink-0"
                        style={{ background: r.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {o.inStock ? r.shipping : "غير متوفر حالياً"}
                        </div>
                      </div>

                      {o.coupon && (
                        <button
                          onClick={() => copyCode(o.coupon!.code)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition"
                        >
                          {copied === o.coupon.code ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {o.coupon.code} · خصم {o.coupon.percent}%
                        </button>
                      )}

                      <div className="ms-auto flex items-center gap-3">
                        {i === 0 && o.inStock ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-success text-success-foreground">
                            الأفضل
                          </span>
                        ) : (
                          diff > 0 && (
                            <span className="text-xs text-hot font-bold">+{diff} ر.س</span>
                          )
                        )}
                        <div className="text-left">
                          {o.coupon && (
                            <div className="text-[10px] text-muted-foreground line-through">
                              {o.price} ر.س
                            </div>
                          )}
                          <div
                            className={`font-display font-black ${o.inStock ? "" : "opacity-50"}`}
                          >
                            {fp} ر.س
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/60 text-muted-foreground font-bold">
      {icon}
      {text}
    </span>
  );
}
