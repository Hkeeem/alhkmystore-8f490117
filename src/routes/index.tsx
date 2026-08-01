import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { bestDeals, comparableGroups, stores, getStore } from "@/data/deals";
import { DealCard } from "@/components/DealCard";
import { IntroVideo } from "@/components/IntroVideo";
import { LazySection } from "@/components/LazySection";
import { getDealIcon, getStoreIcon } from "@/lib/icons";
import {
  Sparkles, TrendingDown, ArrowLeft, Search, Flame, Ticket, Store as StoreIcon,
  Home as HomeIcon, Car, MapPin, Bot, ShieldCheck, Zap, Award,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const top = bestDeals(6);
  const groups = comparableGroups().slice(0, 3);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    navigate({ to: "/chat", search: { q: text } as any });
  };

  const pillars = [
    { to: "/deals", label: "أفضل العروض", icon: Flame, tone: "from-primary/25 to-primary/5", note: "مرتّبة بالذكاء الاصطناعي" },
    { to: "/", label: "مقارنة الأسعار", icon: TrendingDown, tone: "from-accent/25 to-accent/5", note: "نفس المنتج، أرخص متجر", hash: "compare" },
    { to: "/coupons", label: "الكوبونات", icon: Ticket, tone: "from-primary/25 to-primary/5", note: "أحدث الأكواد الفعّالة" },
    { to: "/stores", label: "المتاجر", icon: StoreIcon, tone: "from-accent/25 to-accent/5", note: "+14 متجرًا شريكًا" },
    { to: "/real-estate", label: "العقارات", icon: HomeIcon, tone: "from-primary/25 to-primary/5", note: "ذكاء عقاري — قريباً" },
    { to: "/cars", label: "السيارات", icon: Car, tone: "from-accent/25 to-accent/5", note: "مقارنة وكالات — قريباً" },
    { to: "/maps", label: "الخرائط", icon: MapPin, tone: "from-primary/25 to-primary/5", note: "أقرب العروض — قريباً" },
    { to: "/chat", label: "مساعد حكيم AI", icon: Bot, tone: "from-accent/25 to-accent/5", note: "اسأله بالعربي" },
  ] as const;

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-hero p-6 md:p-12 text-primary-foreground shadow-glow">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-bold mb-5 border border-primary/40">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-gold-shine">HkeeemAI — الذكاء الاقتصادي</span>
          </div>
          <h1 className="font-thuluth text-4xl md:text-7xl leading-[1.6] tracking-normal">
            تسوّق ذكي…
            <br />
            <span className="text-gold-shine">توفير أكثر</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm md:text-lg text-white/80 leading-relaxed">
            عروض، كوبونات، مقارنة أسعار، عقارات، سيارات، وخرائط ذكية — مدعومة بالذكاء الاصطناعي لقرارات شراء أفضل بأقل وقت.
          </p>

          {/* AI search */}
          <form onSubmit={submitSearch} className="mt-7 max-w-2xl">
            <div className="flex items-center gap-2 bg-white/95 rounded-2xl p-2 shadow-glow border border-primary/20">
              <div className="pl-3 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="اسأل حكيم: مثلاً «أرخص أرز بسمتي؟» أو «أفضل عرض جوال»"
                className="flex-1 bg-transparent outline-none text-secondary placeholder:text-secondary/50 py-2 text-sm md:text-base"
                aria-label="بحث ذكي"
              />
              <button type="submit" className="inline-flex items-center gap-1.5 bg-gradient-gold text-secondary font-bold px-4 md:px-5 py-2.5 rounded-xl hover:opacity-95 transition">
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">ابحث</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["أرز بسمتي", "زيت دوار الشمس", "iPhone 16", "عروض النهدي"].map((s) => (
                <button key={s} type="button" onClick={() => { setQ(s); }} className="text-[11px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15">
                  {s}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <Stat n="14+" l="متجر" />
            <Stat n="60٪" l="متوسط التوفير" />
            <Stat n="24/7" l="مساعد ذكي" />
          </div>
        </div>
      </section>

      {/* Intro video */}
      <LazySection minHeight={340}>
        <IntroVideo />
      </LazySection>

      {/* قدرات الذكاء الاقتصادي */}
      <LazySection minHeight={420}>
        <section>
          <SectionHeader title="قدرات الذكاء الاقتصادي" subtitle="مقارنة، تحليل، توليد محتوى، وسوق موحد" icon={<Zap className="w-5 h-5" />} />
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/compare", tag: "محدث لحظياً", title: "محرك مقارنة الأسعار والعروض", desc: "مقارنة لحظية لأسعار الأجهزة والإلكترونيات والمنتجات الوطنية بين نون وأمازون وجرير وإكسترا ومتجر حكيم المباشر مع كود خصم إضافي.", cta: "قارن الآن" },
              { to: "/analysis", tag: "تحليل عميق", title: "تحليل المتاجر والمنافسين بالذكاء الاصطناعي", desc: "تحليل SWOT متكامل: تموضع الأسعار، نقاط القوة والضعف، حساب هامش الربح، واستراتيجيات النمو وتخفيض تكلفة الشحن.", cta: "ابدأ التحليل" },
              { to: "/ads", tag: "توليد فوري", title: "مولد محتوى الإعلانات والوصف التسويقي", desc: "نصوص إعلانية بلهجة سعودية لسناب شات وتيك توك وإنستغرام، مع تحسين الكلمات المفتاحية SEO.", cta: "ولّد إعلانك" },
              { to: "/market", tag: "عقارات وتجارة", title: "سوق حكيم التجاري والعقاري الموحد", desc: "منتجات وعقارات في الرياض وجدة والخبر مع حاسبة العائد الإيجاري، مدى و STC Pay، وشحن سبل وسمسا خلال 24-48 ساعة.", cta: "تصفح السوق والحاسبة" },
            ].map((c) => (
              <Link key={c.to} to={c.to} className="bg-card rounded-3xl border border-border/60 shadow-card p-5 hover-lift flex flex-col">
                <span className="self-start text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">{c.tag}</span>
                <h3 className="font-thuluth text-lg mt-3 leading-[1.8]">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{c.desc}</p>
                <span className="mt-4 self-start text-sm font-bold text-primary">{c.cta} ←</span>
              </Link>
            ))}
          </div>
        </section>
      </LazySection>


      {/* Pillars grid */}

      <section>
        <SectionHeader title="استكشف HkeeemAI" subtitle="كل أقسام المنصة في مكان واحد" icon={<Zap className="w-5 h-5" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.label}
                to={p.to}
                className="group relative overflow-hidden p-4 md:p-5 rounded-3xl bg-card border border-border/60 hover:border-primary/70 hover:shadow-glow transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${p.tone} opacity-60 group-hover:opacity-100 transition`} />
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-secondary text-primary flex items-center justify-center mb-3 ring-1 ring-primary/30 group-hover:scale-105 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-black text-sm md:text-base">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{p.note}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Best deals */}
      <LazySection minHeight={520}>
      <section>
        <SectionHeader
          title="أفضل العروض الآن"
          subtitle="مرتّبة تلقائياً حسب نسبة التوفير"
          icon={<Flame className="w-5 h-5" />}
          href="/deals"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {top.map((d, i) => (
            <DealCard key={d.id} deal={d} rank={i + 1} />
          ))}
        </div>
      </section>
      </LazySection>

      {/* Price comparison */}
      <LazySection minHeight={620} id="compare-wrap">
      <section id="compare">
        <SectionHeader title="مقارنة الأسعار" subtitle="نفس المنتج، أرخص متجر أوّلاً" icon={<TrendingDown className="w-5 h-5" />} />
        <div className="space-y-4">
          {groups.map((g) => {
            const Icon = getDealIcon(g[0]);
            return (
              <div key={g[0].productKey} className="bg-card rounded-3xl border border-border/60 shadow-card overflow-hidden">
                <div className="p-4 bg-gradient-to-l from-primary/10 to-transparent flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center ring-1 ring-primary/40">
                    <Icon className="w-7 h-7 text-primary" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{g[0].title}</h3>
                    {g[0].unit && <p className="text-xs text-muted-foreground">{g[0].unit}</p>}
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-[10px] text-muted-foreground">أرخص سعر</div>
                    <div className="font-display font-black text-lg text-gold-shine">{g[0].price} ر.س</div>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {g.map((d, i) => {
                    const s = getStore(d.storeId);
                    const SIcon = getStoreIcon(s);
                    const diff = d.price - g[0].price;
                    return (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: s.color }}>
                          <SIcon className="w-4 h-4" strokeWidth={2.2} />
                        </div>
                        <span className="flex-1 text-sm font-medium truncate">{s.name}</span>
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
            );
          })}
        </div>
      </section>
      </LazySection>

      {/* Value strip */}
      <LazySection minHeight={220}>
      <section className="grid md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, t: "بيانات موثوقة", d: "أسعار محدّثة من مصادر رسمية" },
          { icon: Award, t: "تجربة فاخرة", d: "تصميم بمعايير أفضل التطبيقات" },
          { icon: Bot, t: "مساعد حكيم AI", d: "قرارات اقتصادية أسرع وأذكى" },
        ].map((f) => (
          <div key={f.t} className="p-5 rounded-3xl bg-secondary text-secondary-foreground shadow-card">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-3">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-thuluth text-lg leading-[1.8]">{f.t}</h3>
            <p className="text-sm text-secondary-foreground/70 mt-1">{f.d}</p>
          </div>
        ))}
      </section>
      </LazySection>

      {/* Stores strip */}
      <LazySection minHeight={140}>
      <section className="pb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-thuluth text-base text-muted-foreground leading-[1.8]">المتاجر المشاركة</h3>
          <Link to="/stores" className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
            كل المتاجر <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {stores.map((s) => {
            const Icon = getStoreIcon(s);
            return (
              <div key={s.id} className="shrink-0 flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 py-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: s.color }}>
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <span className="text-xs font-bold whitespace-nowrap">{s.name}</span>
              </div>
            );
          })}
        </div>
      </section>
      </LazySection>
    </main>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
      <div className="font-display font-black text-lg md:text-2xl bg-gradient-gold bg-clip-text text-transparent">{n}</div>
      <div className="text-[10px] md:text-xs text-white/80">{l}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, href }: { title: string; subtitle: string; icon: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-thuluth text-2xl md:text-3xl leading-[1.8] text-foreground">{title}</h2></div>
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
