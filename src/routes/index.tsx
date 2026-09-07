import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { bestDeals, comparableGroups, stores, getStore } from "@/data/deals";
import { DealCard } from "@/components/DealCard";
import { IntroVideo } from "@/components/IntroVideo";
import { LazySection } from "@/components/LazySection";
import { OffersSection } from "@/components/OffersSection";
import { SocialOffersSection } from "@/components/SocialOffersSection";

import { getDealIcon, getStoreIcon } from "@/lib/icons";
import { useI18n } from "@/lib/i18n";
import {
  Sparkles, TrendingDown, ArrowLeft, Search, Flame, Ticket, Store as StoreIcon,
  Home as HomeIcon, MapPin, Bot, ShieldCheck, Zap, Award,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حكيم AI — أفضل عروض وكوبونات السعودية" },
      { name: "description", content: "منصة سعودية ذكية تجمع أفضل العروض والكوبونات ومقارنة الأسعار في مكان واحد، مرتّبة بالذكاء الاصطناعي." },
      { property: "og:title", content: "حكيم AI — أفضل عروض وكوبونات السعودية" },
      { property: "og:description", content: "قارن الأسعار واكتشف أعلى نسب التوفير في المتاجر السعودية بالذكاء الاصطناعي." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alhkmystore.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://alhkmystore.lovable.app/" }],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
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
    { to: "/deals", label: t("pillar.deals"), icon: Flame, tone: "from-primary/25 to-primary/5", note: t("pillar.dealsNote") },
    { to: "/", label: t("home.compareTitle"), icon: TrendingDown, tone: "from-accent/25 to-accent/5", note: t("pillar.compareNote"), hash: "compare" },
    { to: "/coupons", label: t("item.coupons"), icon: Ticket, tone: "from-primary/25 to-primary/5", note: t("pillar.couponsNote") },
    { to: "/stores", label: t("item.stores"), icon: StoreIcon, tone: "from-accent/25 to-accent/5", note: t("pillar.storesNote") },
    { to: "/real-estate", label: t("pillar.realEstate"), icon: HomeIcon, tone: "from-primary/25 to-primary/5", note: t("pillar.realEstateNote") },
    { to: "/maps", label: t("pillar.maps"), icon: MapPin, tone: "from-primary/25 to-primary/5", note: t("pillar.mapsNote") },
    { to: "/chat", label: t("pillar.assistant"), icon: Bot, tone: "from-accent/25 to-accent/5", note: t("pillar.assistantNote") },
  ] as const;

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-hero p-6 md:p-12 shadow-glow">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <img
            src="/hkeeem_512.png"
            alt="شعار حكيم AI — حرف الحاء الذهبي"
            width={96}
            height={96}
            className="w-20 h-20 md:w-24 md:h-24 rounded-3xl mb-5 shadow-glow border border-primary/30"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur text-sm font-bold mb-5 border border-primary/50">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold">{t("home.badge")}</span>
          </div>
          <h1 className="font-thuluth text-4xl md:text-7xl leading-[1.6] tracking-normal">
            {t("home.title1")}
            <br />
            <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">{t("home.title2")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base md:text-lg font-medium opacity-95 leading-loose">
            {t("home.subtitle")}
          </p>

          <form onSubmit={submitSearch} className="mt-7 max-w-2xl">
            <div className="flex items-center gap-2 bg-card text-card-foreground rounded-2xl p-2 shadow-glow border border-primary/20">
              <div className="pl-3 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("home.searchPlaceholder")}
                className="flex-1 bg-transparent outline-none text-card-foreground placeholder:text-muted-foreground py-2 text-sm md:text-base"
                aria-label={t("home.searchLabel")}
              />
              <button type="submit" className="inline-flex items-center gap-1.5 bg-gradient-gold font-bold px-4 md:px-5 py-2.5 rounded-xl hover:opacity-95 transition">
                <Search className="w-4 h-4" />
                <span className="hidden md:inline leading-normal">{t("home.search")}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["أرز بسمتي", "زيت دوار الشمس", "iPhone 16", "عروض النهدي"].map((s) => (
                <button key={s} type="button" onClick={() => { setQ(s); }} className="leading-normal text-[13px] font-semibold px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/45 backdrop-blur border border-white/25">
                  {s}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <Stat n="65+" l={t("home.statStores")} />
            <Stat n="60%" l={t("home.statSaving")} />
            <Stat n="24/7" l={t("home.statAssistant")} />
          </div>
        </div>
      </section>

      {/* عروض حية من قاعدة البيانات — أول شيء يشوفه المستهلك */}
      <LazySection minHeight={300}>
        <OffersSection />
      </LazySection>

      {/* Best deals — تُعرض فقط عند توفر عروض حقيقية */}
      {top.length > 0 && (
      <LazySection minHeight={520}>
      <section>
        <SectionHeader
          title={t("home.bestTitle")}
          subtitle={t("home.bestSubtitle")}
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
      )}

      {groups.length > 0 && (
      <LazySection minHeight={620} id="compare-wrap">
      <section id="compare">
        <SectionHeader title={t("home.compareTitle")} subtitle={t("home.compareSubtitle")} icon={<TrendingDown className="w-5 h-5" />} />
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
                    <div className="text-[10px] text-muted-foreground">{t("home.cheapest")}</div>
                    <div className="font-display font-black text-lg text-gold-shine">{g[0].price} {t("home.currency")}</div>
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
                        {i === 0? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-success text-success-foreground">{t("home.best")}</span>
                        ) : (
                          <span className="text-xs text-hot font-bold">+{diff} {t("home.currency")}</span>
                        )}
                        <span className="font-display font-black w-16 text-left">{d.price} {t("home.currency")}</span>
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
      )}




      <LazySection minHeight={340}>
        <IntroVideo />
      </LazySection>

      <LazySection minHeight={420}>
        <section>
          <SectionHeader title="قدرات الذكاء الاقتصادي" subtitle="أدوات ذكية تخدم قرارك الشرائي" icon={<Zap className="w-5 h-5" />} />
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/compare", tag: "محدث لحظياً", title: "محرك مقارنة الأسعار والعروض", desc: "قارن سعر نفس المنتج بين نون وأمازون وجرير وإكسترا ومتجر حكيم — وادفع أقل سعر ممكن.", cta: "قارن الآن" },
              { to: "/analysis", tag: "تحليل عميق", title: "تحليل المتاجر والمنافسين بالذكاء الاصطناعي", desc: "تحليل SWOT متكامل: تموضع الأسعار، نقاط القوة والضعف، حساب هامش الربح، واستراتيجيات النمو وتخفيض تكلفة الشحن.", cta: "ابدأ التحليل" },
              { to: "/ads", tag: "توليد فوري", title: "مولد محتوى الإعلانات والوصف التسويقي", desc: "نصوص إعلانية بلهجة سعودية لسناب شات وتيك توك وإنستغرام، مع تحسين الكلمات المفتاحية SEO.", cta: "ولّد إعلانك" },
              { to: "/market", tag: "عقارات وتجارة", title: "سوق حكيم التجاري والعقاري الموحد", desc: "منتجات وعقارات في الرياض وجدة والخبر مع حاسبة العائد الإيجاري، مدى و STC Pay، وشحن سبل وسمسا خلال 24-48 ساعة.", cta: "تصفح السوق والحاسبة" },
            ].map((c) => (
              <Link key={c.to} to={c.to} className="bg-card rounded-3xl border border-border/60 shadow-card p-5 hover-lift flex flex-col">
                <span className="self-start text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 leading-normal">{c.tag}</span>
                <h3 className="font-bold text-lg mt-3 leading-snug">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{c.desc}</p>
                <span className="mt-4 self-start text-sm font-bold text-primary leading-normal">{c.cta} ←</span>
              </Link>
            ))}
          </div>
        </section>
      </LazySection>

      <section>
        <SectionHeader title={t("home.exploreTitle")} subtitle={t("home.exploreSubtitle")} icon={<Zap className="w-5 h-5" />} />
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
                  <div className="font-black text-sm md:text-base leading-normal">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-normal">{p.note}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

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
            <h3 className="font-bold text-lg leading-snug">{f.t}</h3>
            <p className="text-sm text-secondary-foreground/70 mt-1 leading-relaxed">{f.d}</p>
          </div>
        ))}
      </section>
      </LazySection>

      <LazySection minHeight={140}>
      <section className="pb-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-muted-foreground leading-snug">{t("home.partnersTitle")}</h3>
          <Link to="/stores" className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all leading-normal">
            {t("home.allStores")} <ArrowLeft className="w-3 h-3" />
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
    <div className="bg-black/35 backdrop-blur rounded-2xl p-3 text-center border border-white/20">
      <div className="font-display font-black text-xl md:text-2xl text-primary-foreground">{n}</div>
      <div className="text-xs md:text-sm font-semibold text-primary-foreground/90">{l}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, href }: { title: string; subtitle: string; icon: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-black text-2xl md:text-3xl leading-snug text-foreground">{title}</h2></div>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {href && (
        <Link to={href} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all leading-normal">
          عرض الكل <ArrowLeft className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
                }
