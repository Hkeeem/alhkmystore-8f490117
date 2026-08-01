import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Megaphone, Loader2, Sparkles, Copy } from "lucide-react";
import { generateAds, type AdsResult } from "@/lib/ads.functions";

const PLATFORMS = ["سناب شات", "تيك توك", "إنستغرام"] as const;
const DIALECTS = ["سعودية", "فصحى"] as const;

export const Route = createFileRoute("/ads")({
  head: () => ({
    meta: [
      { title: "مولد محتوى الإعلانات — حكيم AI" },
      { name: "description", content: "توليد نصوص إعلانية وحملات تسويقية بلهجات سعودية مخصصة لسناب شات وتيك توك وإنستغرام مع تحسين الكلمات المفتاحية SEO." },
      { property: "og:title", content: "مولد محتوى الإعلانات — حكيم AI" },
      { property: "og:description", content: "نسخ إعلانية جاهزة بلهجة سعودية لكل منصة، مع هاشتاقات وكلمات مفتاحية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdsPage,
});

function AdsPage() {
  const run = useServerFn(generateAds);
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("سناب شات");
  const [dialect, setDialect] = useState<(typeof DIALECTS)[number]>("سعودية");
  const [tone, setTone] = useState("حماسية");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdsResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim()) return toast.error("اكتب اسم المنتج أولاً");
    setLoading(true);
    try {
      const out = await run({ data: { product: product.trim(), audience, platform, dialect, tone } });
      setResult(out);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر توليد المحتوى");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("تم نسخ النص");
  };

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <header className="rounded-[2rem] bg-gradient-hero text-primary-foreground p-6 md:p-9 shadow-glow relative overflow-hidden">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-primary/30 text-xs font-bold mb-4">
            <Megaphone className="w-3.5 h-3.5 text-primary" />
            توليد فوري
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-black">مولد محتوى الإعلانات والوصف التسويقي</h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-white/80 leading-relaxed">
            توليد نصوص إعلانية وحملات تسويقية بلهجات سعودية مخصصة لسناب شات والتيك توك وإنستغرام، مع تحسين الكلمات المفتاحية SEO.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="bg-card rounded-3xl border border-border/60 shadow-card p-5 grid md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className="text-xs font-bold text-muted-foreground mb-1.5 block">المنتج أو الخدمة</span>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="مثال: تمر سكري فاخر توصيل خلال 24 ساعة"
            className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/60"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted-foreground mb-1.5 block">الجمهور المستهدف</span>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="شباب الرياض 20-35"
            className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/60"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted-foreground mb-1.5 block">نبرة الإعلان</span>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="حماسية / راقية / ودّية"
            className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/60"
          />
        </label>

        <div>
          <span className="text-xs font-bold text-muted-foreground mb-1.5 block">المنصة</span>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p} type="button" onClick={() => setPlatform(p)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${platform === p ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-border/60 text-muted-foreground"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-bold text-muted-foreground mb-1.5 block">اللهجة</span>
          <div className="flex flex-wrap gap-2">
            {DIALECTS.map((d) => (
              <button key={d} type="button" onClick={() => setDialect(d)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${dialect === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-border/60 text-muted-foreground"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 inline-flex items-center justify-center gap-2 bg-gradient-gold text-secondary font-bold px-5 py-3 rounded-2xl hover-lift press-ripple disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "جاري التوليد…" : "ولّد المحتوى الإعلاني"}
        </button>
      </form>

      {result && (
        <section className="space-y-4">
          <div className="bg-card rounded-3xl border border-border/60 shadow-card p-5">
            <h2 className="font-display font-black text-lg text-gold-shine">{result.headline}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{result.metaDescription}</p>
            <button onClick={() => copy(`${result.headline}\n${result.metaDescription}`)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Copy className="w-3.5 h-3.5" /> نسخ العنوان والوصف
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {result.copies.map((c, i) => (
              <div key={i} className="bg-card rounded-3xl border border-border/60 shadow-card p-5 flex flex-col">
                <div className="text-xs font-bold text-primary mb-2">نسخة {i + 1} · {platform}</div>
                <div className="font-black text-sm">{c.hook}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{c.body}</p>
                <div className="mt-3 inline-flex self-start text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/30">{c.cta}</div>
                <button onClick={() => copy(`${c.hook}\n${c.body}\n${c.cta}`)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary self-start">
                  <Copy className="w-3.5 h-3.5" /> نسخ النسخة
                </button>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <TagBox title="الهاشتاقات" items={result.hashtags} onCopy={() => copy(result.hashtags.join(" "))} />
            <TagBox title="كلمات SEO المفتاحية" items={result.keywords} onCopy={() => copy(result.keywords.join("، "))} />
          </div>
        </section>
      )}
    </main>
  );
}

function TagBox({ title, items, onCopy }: { title: string; items: string[]; onCopy: () => void }) {
  return (
    <div className="bg-card rounded-3xl border border-border/60 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black">{title}</h3>
        <button onClick={onCopy} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
          <Copy className="w-3.5 h-3.5" /> نسخ الكل
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary/50 border border-border/60">{t}</span>
        ))}
      </div>
    </div>
  );
}
