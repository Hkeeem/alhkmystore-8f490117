import { useMemo, useState } from "react";
import { ExternalLink, Megaphone, Search } from "lucide-react";
import { STORES_DIRECTORY } from "@/data/hkeeem-stores-directory";

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

export function SocialOffersSection() {
  const [platform, setPlatform] = useState<string>("snapchat");
  const [q, setQ] = useState("");

  const active = PLATFORMS.find((p) => p.id === platform)!;

  const stores = useMemo(() => {
    const ranked = TOP_SOCIAL_STORE_IDS
      .map((id) => STORES_DIRECTORY.find((s) => s.id === id))
      .filter(Boolean) as typeof STORES_DIRECTORY;
    const text = q.trim();
    if (!text) return ranked;
    return STORES_DIRECTORY.filter((s) => s.name.includes(text) || s.category.includes(text));
  }, [q]);

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
            افتح قنوات المتاجر الرسمية على منصات التواصل وشوف أقوى عروضها اللحظية
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

      <div className="flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 py-2 mb-4">
        <Search className="w-4 h-4 text-primary shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن متجر أو فئة… مثلاً: بقالة، نون، تجميل"
          aria-label="بحث في متاجر السوشال ميديا"
          className="flex-1 bg-transparent outline-none text-sm py-1"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {stores.map((s) => (
          <a
            key={s.id}
            href={active.build(s.name)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/70 hover:shadow-glow transition"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary text-primary font-black flex items-center justify-center ring-1 ring-primary/30 shrink-0">
              {s.name.trim().charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate leading-normal">{s.name}</div>
              <div className="text-[11px] text-muted-foreground truncate leading-normal">
                {active.label} · {s.category}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100 shrink-0" />
          </a>
        ))}
      </div>

      {stores.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">لا يوجد متجر مطابق لبحثك.</p>
      )}

      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        الروابط تفتح البحث الرسمي داخل كل منصة عن حسابات المتجر — لا نعرض أي عرض أو كوبون غير موثّق.
      </p>
    </section>
  );
}
