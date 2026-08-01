import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BarChart3, Loader2, Sparkles, Calculator } from "lucide-react";
import { analyzeStore, type StoreAnalysis } from "@/lib/insights.functions";
import { stores } from "@/data/deals";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "تحليل المتاجر والمنافسين — حكيم AI" },
      { name: "description", content: "تحليل SWOT متكامل للمتاجر السعودية: تموضع الأسعار، نقاط القوة والضعف، حساب هامش الربح، واستراتيجيات النمو وتخفيض تكلفة الشحن." },
      { property: "og:title", content: "تحليل المتاجر والمنافسين — حكيم AI" },
      { property: "og:description", content: "تحليل عميق للمتاجر السعودية بالذكاء الاصطناعي مع حاسبة هامش الربح." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const run = useServerFn(analyzeStore);
  const [store, setStore] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StoreAnalysis | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store.trim()) return toast.error("اكتب اسم المتجر أولاً");
    setLoading(true);
    try {
      const out = await run({ data: { store: store.trim(), competitors, notes } });
      setResult(out);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إجراء التحليل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-6">
      <header className="rounded-[2rem] bg-gradient-hero text-primary-foreground p-6 md:p-9 shadow-glow relative overflow-hidden">
        <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-primary/30 text-xs font-bold mb-4">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            تحليل عميق
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-black">الذكاء الاصطناعي لتحليل المتاجر والمنافسين</h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-white/80 leading-relaxed">
            تحليل SWOT متكامل للمتاجر السعودية: تموضع الأسعار، نقاط القوة والضعف، حساب هامش الربح، واستراتيجيات النمو وتخفيض تكلفة الشحن.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
        <form onSubmit={submit} className="bg-card rounded-3xl border border-border/60 shadow-card p-5 space-y-4">
          <Field label="اسم المتجر">
            <input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              list="hk-stores"
              placeholder="مثال: أسواق العثيم"
              className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/60"
            />
            <datalist id="hk-stores">
              {stores.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
          </Field>
          <Field label="المنافسون (اختياري)">
            <input
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="بنده، لولو، الدانوب"
              className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/60"
            />
          </Field>
          <Field label="ملاحظات إضافية (اختياري)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="الفئة، المدن المستهدفة، متوسط قيمة السلة…"
              className="w-full bg-secondary/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/60 resize-none"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-gold text-secondary font-bold px-5 py-3 rounded-2xl hover-lift press-ripple disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "جاري التحليل…" : "حلّل الآن"}
          </button>
        </form>

        <MarginCalculator />
      </div>

      {result && (
        <section className="space-y-4">
          <div className="bg-card rounded-3xl border border-border/60 shadow-card p-5">
            <h2 className="font-black mb-2">تموضع الأسعار</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.positioning}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SwotCard title="نقاط القوة" items={result.strengths} tone="bg-success/10 border-success/30" />
            <SwotCard title="نقاط الضعف" items={result.weaknesses} tone="bg-hot/10 border-hot/30" />
            <SwotCard title="الفرص" items={result.opportunities} tone="bg-primary/10 border-primary/30" />
            <SwotCard title="التهديدات" items={result.threats} tone="bg-accent/10 border-accent/30" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SwotCard title="استراتيجيات النمو" items={result.growth} tone="bg-card border-border/60" />
            <SwotCard title="تخفيض تكلفة الشحن" items={result.shipping} tone="bg-card border-border/60" />
          </div>
        </section>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function SwotCard({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className={`rounded-3xl border p-5 ${tone}`}>
      <h3 className="font-black mb-2">{title}</h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{t}</span></li>
        ))}
      </ul>
    </div>
  );
}

function MarginCalculator() {
  const [cost, setCost] = useState(100);
  const [price, setPrice] = useState(150);
  const [shipping, setShipping] = useState(18);
  const profit = price - cost - shipping;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const vat = Math.round(price - price / 1.15);

  return (
    <div className="bg-secondary text-secondary-foreground rounded-3xl shadow-card p-5">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <Calculator className="w-5 h-5" />
        <h2 className="font-black text-foreground/90">حاسبة هامش الربح</h2>
      </div>
      <div className="space-y-3">
        <NumField label="تكلفة المنتج (ر.س)" value={cost} onChange={setCost} />
        <NumField label="سعر البيع شامل الضريبة (ر.س)" value={price} onChange={setPrice} />
        <NumField label="تكلفة الشحن (ر.س)" value={shipping} onChange={setShipping} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric label="صافي الربح" value={`${profit} ر.س`} />
        <Metric label="هامش الربح" value={`${margin.toFixed(1)}٪`} />
        <Metric label="ضريبة القيمة" value={`${vat} ر.س`} />
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
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
      <div className="font-display font-black text-primary">{value}</div>
      <div className="text-[10px] text-secondary-foreground/70 mt-0.5">{label}</div>
    </div>
  );
}
