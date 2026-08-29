import { useEffect, useMemo, useState } from "react";
import { Clock, ExternalLink, MapPin, Megaphone, Search, Sparkles, Star, Tag } from "lucide-react";
import { STORES_DIRECTORY } from "@/data/hkeeem-stores-directory";
import {
  loadSocialPrefs,
  rankSocialStores,
  recordSocialClick,
  toggleFavoriteCategory,
  peakLabel,
  TIMING_OPTIONS,
  type SocialPrefs,
  type TimingFilter,
} from "@/lib/social-rank";

type Platform = {
  id: string;
  label: string;
  /** رابط بحث رسمي داخل المنصة عن قنوات المتجر وعروضه */
  build: (query: string) => string;
  color: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "snapchat",
    label: "سناب شات",
    color: "#FFFC00",
    build: (q) => `https://www.snapchat.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "tiktok",
    label: "تيك توك",
    color: "#25F4EE",
    build: (q) => `https://www.tiktok.com/search?q=${encodeURIComponent(q + " عروض")}`,
  },
  {
    id: "instagram",
    label: "إنستغرام",
    color: "#E1306C",
    build: (q) => `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "x",
    label: "منصة X",
    color: "#FFFFFF",
    build: (q) => `https://x.com/search?q=${encodeURIComponent(q + " عروض")}&f=live`,
  },
  {
    id: "youtube",
    label: "يوتيوب",
    color: "#FF0000",
    build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " عروض")}`,
  },
  {
    id: "telegram",
    label: "تيليجرام",
    color: "#29A9EB",
    build: (q) => `https://t.me/s/${encodeURIComponent(q)}`,
  },
];

/** المتاجر الأقوى نشاطاً في السوشال ميديا (حسب حضورها الرسمي في السعودية) */
const TOP_SOCIAL_STORE_IDS = [
  "noon", "amazon-sa", "extra", "jarir", "shein", "namshi", "nice-one", "nahdi",
  "panda", "othaim", "carrefour-sa", "lulu", "jahez", "hungerstation", "styli",
  "trendyol", "sephora-sa", "golden-scent", "ikea-sa", "home-centre", "floward", "almosafer",
];

const EMPTY_PREFS: SocialPrefs = { storeClicks: {}, platformClicks: {}, favoriteCategories: [] };

const REGIONS = ["الكل", "السعودية", "الخليج", "عالمي"] as const;

/** تطبيع النص العربي للبحث: إزالة التشكيل وتوحيد الألف/الياء/التاء المربوطة */
function normalizeAr(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function SocialOffersSection() {
  const [platform, setPlatform] = useState<string>("snapchat");
  const [q, setQ] = useState("");
  const [prefs, setPrefs] = useState<SocialPrefs>(EMPTY_PREFS);
  const [personalized, setPersonalized] = useState(true);
  const [region, setRegion] = useState<string>("الكل");
  const [category, setCategory] = useState<string>("الكل");
  const [timing, setTiming] = useState<TimingFilter>("all");

  useEffect(() => {
    const stored = loadSocialPrefs();
    setPrefs(stored);
    const top = Object.entries(stored.platformClicks).sort((a, b) => b[1] - a[1])[0];
    if (top && PLATFORMS.some((p) => p.id === top[0])) setPlatform(top[0]);
  }, []);

  const active = PLATFORMS.find((p) => p.id === platform)!;

  const basePool = useMemo(
    () =>
      TOP_SOCIAL_STORE_IDS
        .map((id) => STORES_DIRECTORY.find((s) => s.id === id))
        .filter(Boolean) as typeof STORES_DIRECTORY,
    [],
  );

  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set(basePool.map((s) => s.category)))],
    [basePool],
  );

  const ranked = useMemo(() => {
    const text = normalizeAr(q);
    const words = text ? text.split(" ") : [];
    let pool = text ? STORES_DIRECTORY : basePool;

    if (words.length) {
      pool = pool.filter((s) => {
        const haystack = normalizeAr(`${s.name} ${s.category} ${s.region}`);
        return words.every((w) => haystack.includes(w));
      });
    }
    if (region !== "الكل") pool = pool.filter((s) => s.region === region);
    if (category !== "الكل") pool = pool.filter((s) => s.category === category);

    return rankSocialStores(pool, platform, personalized ? prefs : EMPTY_PREFS, timing);
  }, [q, platform, prefs, personalized, region, category, timing, basePool]);

  const handleOpen = (storeId: string) => {
    setPrefs((prev) => recordSocialClick(prev, storeId, platform));
  };

  const resetFilters = () => {
    setQ("");
    setRegion("الكل");
    setCategory("الكل");
    setTiming("all");
  };


  return (
    <section aria-labelledby="social-offers-title">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="w-5 h-5" />
            <h2 id="social-offers-title" className="font-black text-2xl md:text-3xl leading-snug text-foreground">
              عروض السوشال ميديا الأقوى
            </h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            ترتيب ذكي حسب قوة المتجر وتفاعله على المنصة واهتماماتك
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            aria-pressed={platform === p.id}
            className={`text-[13px] font-bold px-3.5 py-2 rounded-full border transition ${
              platform === p.id
                ? "bg-gradient-gold text-secondary border-primary shadow-glow"
                : "bg-card text-foreground border-border/60 hover:border-primary/60"
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full ml-2 align-middle" style={{ background: p.color }} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 py-2 mb-3">
        <Search className="w-4 h-4 text-primary shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم المتجر أو الفئة أو الموقع… مثلاً: تجميل السعودية"
          aria-label="بحث في متاجر السوشال ميديا"
          className="flex-1 bg-transparent outline-none text-sm py-1"
        />
        {(q || region !== "الكل" || category !== "الكل" || timing !== "all") && (
          <button type="button" onClick={resetFilters} className="text-[11px] font-bold text-primary shrink-0">
            مسح الفلاتر
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
        <label className="flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 py-2">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="sr-only">الموقع</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="تصفية حسب الموقع"
            className="flex-1 bg-transparent outline-none text-[13px] font-bold"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r} className="bg-card text-foreground">{r}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 py-2">
          <Tag className="w-4 h-4 text-primary shrink-0" />
          <span className="sr-only">الفئة</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="تصفية حسب الفئة"
            className="flex-1 bg-transparent outline-none text-[13px] font-bold"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-card text-foreground">{c}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 py-2 col-span-2 md:col-span-1">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{peakLabel(platform)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="تصفية حسب التوقيت">
        {TIMING_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTiming(t.id)}
            aria-pressed={timing === t.id}
            className={`text-[12px] font-bold px-3 py-1.5 rounded-full border transition ${
              timing === t.id
                ? "bg-primary/15 text-primary border-primary/70"
                : "bg-card text-muted-foreground border-border/60 hover:border-primary/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPersonalized((v) => !v)}
          aria-pressed={personalized}
          className={`text-[12px] font-bold px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1.5 ${
            personalized
              ? "bg-gradient-gold text-secondary border-primary shadow-glow"
              : "bg-card text-muted-foreground border-border/60 hover:border-primary/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          ترتيب ذكي مخصص لي
        </button>
        {categories.filter((c) => c !== "الكل").map((c) => {
          const on = prefs.favoriteCategories.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setPrefs((prev) => toggleFavoriteCategory(prev, c))}
              aria-pressed={on}
              className={`text-[12px] font-bold px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                on
                  ? "bg-primary/15 text-primary border-primary/70"
                  : "bg-card text-muted-foreground border-border/60 hover:border-primary/50"
              }`}
            >
              <Star className={`w-3 h-3 ${on ? "fill-current" : ""}`} />
              {c}
            </button>
          );
        })}
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {ranked.map(({ store: s, score, reasons }, i) => (
          <div
            key={s.id}
            className="group relative flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/70 hover:shadow-glow transition"
          >
            {i < 3 && !q.trim() && (
              <span className="absolute -top-2 -start-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-gold shadow-glow">
                #{i + 1}
              </span>
            )}
            {/* البطاقة تفتح صفحة العروض الرسمية للمتجر */}
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => handleOpen(s.id)}
              className="flex items-center gap-3 flex-1 min-w-0"
              aria-label={`فتح العروض الرسمية لمتجر ${s.name}`}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary text-primary font-black flex items-center justify-center ring-1 ring-primary/30 shrink-0">
                {s.name.trim().charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate leading-normal">{s.name}</div>
                <div className="text-[11px] text-muted-foreground truncate leading-normal">
                  {reasons[0] ?? `عروض ${s.name} الرسمية`}
                </div>
                <div className="text-[10px] text-primary/80 mt-0.5" aria-label={`درجة القوة ${score} من 100`}>
                  قوة العرض {Math.round(score)}٪
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100 shrink-0" />
            </a>
            {/* زر ثانوي: البحث عن عروض المتجر داخل المنصة الاجتماعية المختارة */}
            <a
              href={active.build(s.name)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => handleOpen(s.id)}
              aria-label={`البحث عن عروض ${s.name} في ${active.label}`}
              title={`عروض ${s.name} على ${active.label}`}
              className="shrink-0 p-1.5 rounded-full border border-border/60 hover:border-primary/60 hover:bg-primary/10 transition"
            >
              <Megaphone className="w-3.5 h-3.5 text-primary" />
            </a>
          </div>
        ))}
      </div>

      {ranked.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          لا يوجد متجر مطابق للموقع أو الفئة أو التوقيت المختار — جرّب توسيع الفلاتر.
        </p>
      )}

      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        الترتيب يعتمد على قوة المتجر (40٪) وتفاعله على المنصة (30٪) وتفضيلاتك المحفوظة على جهازك (30٪) — لا نعرض أي عرض أو كوبون غير موثّق.
      </p>
    </section>
  );
}
