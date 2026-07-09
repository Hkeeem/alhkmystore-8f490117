import { createFileRoute, Link } from "@tanstack/react-router";
import { bestDeals, comparableGroups, stores, getStore } from "@/data/deals";
import { DealCard } from "@/components/DealCard";
import { Sparkles, TrendingDown, ArrowLeft, ShoppingBag, Utensils, Smartphone, Pill } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const categoryIcons = {
  "سوبرماركت": ShoppingBag,
  "مطاعم": Utensils,
  "إلكترونيات": Smartphone,
  "صيدلية": Pill,
} as const;

function Home() {
  const top = bestDeals(6);
  const groups = comparableGroups().slice(0, 3);
  const cats = ["سوبرماركت", "مطاعم", "إلكترونيات", "صيدلية"] as const;

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 md:p-10 text-primary-foreground shadow-glow">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 w-72 h-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            مدعوم بالذكاء الاصطناعي
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-black leading-tight">
            كل عروض المملكة
            <br />
            <span className="text-accent">في مكان واحد.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm md:text-base text-white/80 leading-relaxed">
            جمعنا لك عروض العثيم، بنده، لولو، الدانوب، نون، جرير، النهدي وغيرها. ورتّبناها بالذكاء الاصطناعي عشان توفّر أكثر بأقل وقت.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/deals" className="inline-flex items-center gap-2 bg-white text-primary px-5 py-3 rounded-2xl font-bold shadow-soft hover:scale-[1.02] transition">
              تصفّح كل العروض
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link to="/smart-list" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-5 py-3 rounded-2xl font-bold hover:bg-white/25 transition">
              قائمة تسوّق ذكية
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <Stat n="14+" l="متجر" />
            <Stat n="60%" l="متوسط التوفير" />
            <Stat n="24/7" l="مساعد ذكي" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="grid grid-cols-4 gap-3">
          {cats.map((c) => {
            const Icon = categoryIcons[c];
            return (
              <Link
                key={c}
                to="/deals"
                search={{ cat: c }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary hover:shadow-soft transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-accent/30 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-center">{c}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Best deals */}
      <section>
        <SectionHeader
          title="أفضل العروض الآن"
          subtitle="مرتّبة تلقائياً حسب نسبة التوفير"
          icon={<Sparkles className="w-5 h-5" />}
          href="/deals"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {top.map((d, i) => (
            <DealCard key={d.id} deal={d} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Price comparison */}
      <section>
        <SectionHeader
          title="مقارنة الأسعار"
          subtitle="نفس المنتج، أرخص متجر أوّلاً"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g[0].productKey} className="bg-card rounded-3xl border border-border/50 shadow-card overflow-hidden">
              <div className="p-4 bg-gradient-to-l from-secondary to-transparent flex items-center gap-3">
                <div className="text-4xl">{g[0].image}</div>
                <div className="flex-1">
                  <h3 className="font-bold">{g[0].title}</h3>
                  {g[0].unit && <p className="text-xs text-muted-foreground">{g[0].unit}</p>}
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-muted-foreground">أرخص سعر</div>
                  <div className="font-display font-black text-lg text-primary">{g[0].price} ر.س</div>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {g.map((d, i) => {
                  const s = getStore(d.storeId);
                  const diff = d.price - g[0].price;
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: s.color }}>{s.logo}</div>
                      <span className="flex-1 text-sm font-medium">{s.name}</span>
                      {i === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-success text-success-foreground">الأفضل</span>
                      ) : (
                        <span className="text-xs text-hot font-bold">+{diff} ر.س</span>
                      )}
                      <span className="font-display font-black w-16 text-left">{d.price} ر.س</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stores strip */}
      <section className="pb-10">
        <h3 className="font-bold text-sm text-muted-foreground mb-3">المتاجر المشاركة</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {stores.map((s) => (
            <div key={s.id} className="shrink-0 flex items-center gap-2 bg-card border border-border/50 rounded-2xl px-3 py-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: s.color }}>{s.logo}</div>
              <span className="text-xs font-bold whitespace-nowrap">{s.name}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center">
      <div className="font-display font-black text-lg md:text-2xl">{n}</div>
      <div className="text-[10px] md:text-xs text-white/80">{l}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, href }: { title: string; subtitle: string; icon: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-display font-black text-xl md:text-2xl text-foreground">{title}</h2></div>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {href && (
        <Link to={href} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
          عرض الكل <ArrowLeft className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
