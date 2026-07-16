import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { buildSmartList } from "@/lib/smart-list.functions";
import { useEffect, useRef, useState } from "react";
import { Sparkles, ListChecks, Loader2, Wallet, Share2, AlertTriangle, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { getStore } from "@/data/deals";
import { ShareSheet, buildSmartListShareText } from "@/components/ShareSheet";
import { z } from "zod";


export const Route = createFileRoute("/smart-list")({
  validateSearch: z.object({ q: z.string().optional(), auto: z.coerce.number().optional() }),
  head: () => ({
    meta: [
      { title: "قائمة تسوّق ذكية - وفّر" },
      { name: "description", content: "اكتب قائمة تسوّقك ودع الذكاء الاصطناعي يوزّعها على أرخص المتاجر." },
    ],
  }),
  component: SmartList,
});

type Result = Awaited<ReturnType<typeof buildSmartList>>;

const DEFAULT_TEXT = "أرز بسمتي\nزيت طبخ\nحليب\nدجاج\nبيض";

function decodeQ(q?: string): string | null {
  if (!q) return null;
  try {
    const b64 = q.replace(/-/g, "+").replace(/_/g, "/");
    const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    const decoded = decodeURIComponent(escape(bin)).trim();
    return decoded.length > 0 ? decoded : null;
  } catch { return null; }
}

function encodeQ(text: string): string {
  try {
    const bin = unescape(encodeURIComponent(text));
    const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch { return ""; }
}

function SmartList() {
  const search = Route.useSearch();
  const run = useServerFn(buildSmartList);

  // Start with default to avoid SSR/CSR hydration mismatch; hydrate from q in effect.
  const [text, setText] = useState(DEFAULT_TEXT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const hydrated = useRef(false);

  async function submit(t: string = text) {
    const trimmed = t.trim();
    if (!trimmed) {
      setError("اكتب منتج واحد على الأقل قبل بناء القائمة.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await run({ data: { text: trimmed } });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const decoded = decodeQ(search.q);
    const wantsAuto = search.auto === 1;

    if (search.q && !decoded) {
      setNotice("الرابط لا يحتوي على قائمة صالحة — تم تحميل قائمة افتراضية.");
      return;
    }

    if (decoded) {
      setText(decoded);
      if (wantsAuto) submit(decoded);
      return;
    }

    if (wantsAuto && !search.q) {
      setNotice("الرابط ينقصه محتوى القائمة (q). اكتب منتجاتك وابنِ القائمة يدوياً.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/smart-list?q=${encodeQ(text)}&auto=1`
    : "";




  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-10 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-primary text-sm font-bold">
          <Sparkles className="w-4 h-4" />
          ذكاء اصطناعي
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl mt-1">قائمة تسوّق ذكية</h1>
        <p className="text-sm text-muted-foreground mt-1">اكتب اللي تبيه، ونحن نوزّعه على أرخص المتاجر ونحسب لك التوفير.</p>
      </div>

      <div className="bg-card rounded-3xl border border-border/50 shadow-card p-4 space-y-3">
        <label className="text-xs font-bold text-muted-foreground">منتج في كل سطر</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="w-full bg-secondary/50 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => submit()}
            disabled={loading || !text.trim()}
            className="flex-1 bg-gradient-hero text-primary-foreground py-3.5 rounded-2xl font-bold shadow-glow disabled:opacity-60 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> يفكّر...</> : <><Sparkles className="w-4 h-4" /> ابنِ قائمتي الذكية</>}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            disabled={!text.trim()}
            aria-label="شارك رابط القائمة"
            className="shrink-0 bg-secondary text-foreground py-3.5 px-4 rounded-2xl font-bold border border-border/50 disabled:opacity-60 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
          >
            <Share2 className="w-4 h-4" />
            شارك
          </button>
        </div>
        {notice && (
          <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{notice}</span>
            <button onClick={() => setNotice(null)} className="text-xs font-bold opacity-70 hover:opacity-100">إغلاق</button>
          </div>
        )}
        {error && <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</div>}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-hero text-primary-foreground rounded-3xl p-5 shadow-glow">
              <div className="text-xs opacity-80">إجمالي قائمتك</div>
              <div className="font-display font-black text-3xl mt-1">{result.total} <span className="text-sm">ر.س</span></div>
            </div>
            <div className="bg-gradient-gold text-accent-foreground rounded-3xl p-5 shadow-soft">
              <div className="text-xs opacity-80 flex items-center gap-1"><Wallet className="w-3 h-3" /> وفّرت</div>
              <div className="font-display font-black text-3xl mt-1">{result.saved} <span className="text-sm">ر.س</span></div>
            </div>
          </div>

          <div className="bg-secondary/70 rounded-2xl p-4 text-sm leading-relaxed">
            <div className="font-bold flex items-center gap-1 mb-1"><Sparkles className="w-3.5 h-3.5 text-primary" /> ملاحظة الذكاء</div>
            {result.strategy}
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-hero text-primary-foreground py-3.5 rounded-2xl font-bold shadow-glow transition hover:scale-[1.01]"
          >
            <Share2 className="w-4 h-4" />
            شارك القائمة
          </button>

          <div className="bg-card rounded-3xl border border-border/50 overflow-hidden divide-y divide-border/50">

            <div className="p-4 flex items-center gap-2 font-bold"><ListChecks className="w-4 h-4 text-primary" /> قائمتك المُحسّنة</div>
            {result.items.map((it, i) => {
              if (!it.deal) return (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="text-2xl">🔎</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{it.requested}</div>
                    <div className="text-xs text-muted-foreground">ما لقينا عرض مطابق حالياً</div>
                  </div>
                </div>
              );
              const s = getStore(it.deal.storeId);
              return (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="text-3xl">{it.deal.image}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{it.deal.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black" style={{ background: s.color }}>{s.logo}</div>
                      <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="font-display font-black text-primary">{it.deal.price} <span className="text-[10px] font-medium">ر.س</span></div>
                    <div className="text-[10px] text-muted-foreground line-through">{it.deal.originalPrice}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="قائمة تسوّق ذكية - وفّر"
        text={result ? buildSmartListShareText(result) : `قائمة تسوّقي على وفّر:\n\n${text}\n\nافتح الرابط لتشغيل القائمة بالذكاء الاصطناعي 👇`}
        url={shareUrl}
      />
    </main>
  );
}

