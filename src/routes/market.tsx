import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  ShoppingBag,
  CreditCard,
  Truck,
  Sparkles,
  Calculator,
  MapPin,
} from "lucide-react";
import { priceProducts, bestOffer, finalPrice, getRetailer } from "@/data/price-index";
import { realEstateListings } from "@/data/real-estate-listings";

const CITIES = ["الكل", "الرياض", "جدة", "الخبر"] as const;

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "سوق حكيم التجاري والعقاري — حكيم AI" },
      {
        name: "description",
        content:
          "تصفح المنتجات والعقارات في السعودية (الرياض، جدة، الخبر) مع حاسبة العائد الإيجاري، مدى و STC Pay، والشحن السريع عبر سبل وسمسا.",
      },
      { property: "og:title", content: "سوق حكيم التجاري والعقاري الموحد" },
      {
        property: "og:description",
        content: "منتجات وعقارات في مكان واحد مع حاسبة العائد الإيجاري ودفع آمن وشحن سريع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const [tab, setTab] = useState<"products" | "estate">("products");
  const [city, setCity] = useState<(typeof CITIES)[number]>("الكل");

  const listings = useMemo(
    () =>
      realEstateListings
        .filter((l) => city === "الكل" || String(l.city ?? "").includes(city))
        .slice(0, 9),
    [city],
  );

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <header className="rounded-[2rem] bg-gradient-hero text-primary-foreground p-6 md:p-9 shadow-glow relative overflow-hidden">
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-primary/30 text-xs font-bold mb-4">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            عقارات وتجارة
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-black">
            سوق حكيم التجاري والعقاري الموحد
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-white/80 leading-relaxed">
            تصفح المنتجات والعقارات في السعودية (الرياض، جدة، الخبر) مع حاسبة العائد الإيجاري، ربط
            مدى و STC Pay والشحن السريع عبر سبل وسمسا.
          </p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Trust
          icon={<CreditCard className="w-4 h-4" />}
          title="مدى و STC Pay"
          sub="دفع آمن وسريع"
        />
        <Trust icon={<Truck className="w-4 h-4" />} title="سبل وسمسا" sub="توصيل خلال 24-48 س" />
        <Trust
          icon={<Sparkles className="w-4 h-4" />}
          title="ذكاء Gemini 3.6"
          sub="مقارنات وتحليلات دقيقة"
        />
        <Trust
          icon={<ShoppingBag className="w-4 h-4" />}
          title="بالريال السعودي SAR"
          sub="شامل ضريبة القيمة المضافة"
        />
      </div>

      <div className="flex items-center gap-2">
        <TabBtn
          active={tab === "products"}
          onClick={() => setTab("products")}
          icon={<ShoppingBag className="w-4 h-4" />}
          label="منتجات"
        />
        <TabBtn
          active={tab === "estate"}
          onClick={() => setTab("estate")}
          icon={<Building2 className="w-4 h-4" />}
          label="عقارات"
        />
      </div>

      {tab === "products" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {priceProducts.map((p) => {
            const best = bestOffer(p);
            const r = getRetailer(best.retailerId);
            return (
              <article
                key={p.id}
                className="bg-card rounded-3xl border border-border/60 shadow-card p-5 hover-lift"
              >
                <div className="text-[11px] font-bold text-primary mb-1">{p.category}</div>
                <h2 className="font-bold leading-snug">{p.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.brand}
                  {p.unit ? ` · ${p.unit}` : ""}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground">أفضل سعر لدى {r.name}</div>
                    <div className="font-display font-black text-xl text-gold-shine">
                      {finalPrice(best)} ر.س
                    </div>
                  </div>
                  <Link
                    to="/compare"
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/30"
                  >
                    قارن الأسعار
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${city === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => (
              <article
                key={l.id}
                className="bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden hover-lift"
              >
                {l.image && (
                  <img
                    src={l.image}
                    alt={l.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-5">
                  <h2 className="font-bold leading-snug line-clamp-1">{l.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {l.district ?? ""}
                    {l.city ? ` · ${l.city}` : ""}
                  </p>
                  <div className="mt-3 font-display font-black text-lg text-gold-shine">
                    {Number(l.price).toLocaleString("ar-SA")} ر.س
                  </div>
                </div>
              </article>
            ))}
            {listings.length === 0 && (
              <p className="text-sm text-muted-foreground">لا يوجد حالياً عقار في هذه المدينة.</p>
            )}
          </div>
        </>
      )}

      <YieldCalculator />
    </main>
  );
}

function Trust({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{title}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl border transition ${active ? "bg-gradient-gold text-secondary border-primary" : "bg-card border-border/60 text-muted-foreground"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function YieldCalculator() {
  const [price, setPrice] = useState(900000);
  const [rent, setRent] = useState(55000);
  const [fees, setFees] = useState(6000);
  const net = rent - fees;
  const yieldPct = price > 0 ? (net / price) * 100 : 0;
  const payback = net > 0 ? price / net : 0;

  return (
    <section className="bg-secondary text-secondary-foreground rounded-3xl shadow-card p-5">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <Calculator className="w-5 h-5" />
        <h2 className="font-black">حاسبة العائد الإيجاري</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <NumField label="سعر العقار (ر.س)" value={price} onChange={setPrice} />
        <NumField label="الإيجار السنوي (ر.س)" value={rent} onChange={setRent} />
        <NumField label="مصاريف سنوية (ر.س)" value={fees} onChange={setFees} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric label="صافي الدخل السنوي" value={`${net.toLocaleString("ar-SA")} ر.س`} />
        <Metric label="العائد الإيجاري" value={`${yieldPct.toFixed(2)}٪`} />
        <Metric label="فترة الاسترداد" value={payback > 0 ? `${payback.toFixed(1)} سنة` : "—"} />
      </div>
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-secondary-foreground/70 mb-1.5 block">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-background/10 rounded-xl px-3 py-2.5 text-sm outline-none border border-primary/20 focus:border-primary/60"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary/10 border border-primary/25 p-3">
      <div className="font-display font-black text-primary text-sm">{value}</div>
      <div className="text-[10px] text-secondary-foreground/70 mt-0.5">{label}</div>
    </div>
  );
}
