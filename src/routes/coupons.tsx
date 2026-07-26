import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Check, Ticket, Search, MessageCircle } from "lucide-react";
import { StoreLogo } from "@/components/StoreLogo";
import { toast } from "sonner";
import { coupons, storeById } from "@/data/coupons";
import { addPoints } from "@/lib/rewards";
import { ShareSheet } from "@/components/ShareSheet";

export const Route = createFileRoute("/coupons")({
  head: () => ({
    meta: [
      { title: "كوبونات وأكواد خصم — وفّر" },
      { name: "description", content: "أحدث كوبونات وأكواد الخصم لمتاجر المملكة: هنقرستيشن، جاهز، نون، جرير، النهدي والمزيد. انسخ الكود واستخدمه فوراً." },
      { property: "og:title", content: "كوبونات وأكواد خصم — وفّر" },
      { property: "og:description", content: "أكواد خصم جاهزة للنسخ من كل متاجر المملكة." },
    ],
  }),
  component: CouponsPage,
});

const CATEGORIES = ["الكل", "أول طلب", "شحن مجاني", "خصم عام", "حصري"] as const;

function CouponsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("الكل");
  const [copied, setCopied] = useState<string | null>(null);
  const [share, setShare] = useState<{ open: boolean; text: string; title: string; url: string }>({ open: false, text: "", title: "", url: "" });

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (cat !== "الكل" && c.category !== cat) return false;
      if (!q.trim()) return true;
      const s = storeById(c.storeId);
      const hay = `${c.title} ${c.description} ${c.code} ${s?.name ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [q, cat]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      const s = addPoints("copy_coupon");
      toast.success(`تم نسخ الكود ${code} · +10 نقاط (المجموع ${s.points})`);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("تعذّر نسخ الكود");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10">
      <section className="rounded-3xl bg-gradient-hero p-6 md:p-8 mb-6 shadow-glow">
        <div className="flex items-center gap-3 text-primary-foreground">
          <Ticket className="w-8 h-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black">كوبونات وأكواد خصم</h1>
            <p className="text-sm opacity-90 mt-1">انسخ الكود واستخدمه في المتجر — وكل نسخة تكسبك 10 نقاط 🎁</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن متجر أو كوبون..."
            className="w-full rounded-2xl border border-border/60 bg-card px-10 py-3 text-sm outline-none focus:border-primary transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                cat === c ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const s = storeById(c.storeId);
          const isCopied = copied === c.code;
          return (
            <article
              key={c.id}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-glow transition"
            >
              <Link
                to="/coupons/$id"
                params={{ id: c.id }}
                className="flex items-start gap-4 hover:opacity-95"
              >
                {s ? (
                  <StoreLogo store={s} size="lg" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground font-black text-xl shrink-0">?</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s?.name}
                    {c.category && (
                      <span className="mr-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {c.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-lg mt-1 leading-tight">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                  {c.minOrder && (
                    <p className="text-[11px] text-muted-foreground mt-1">حد أدنى للطلب: {c.minOrder} ر.س</p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <div className="text-2xl font-black text-primary">{c.discount}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">ينتهي: {c.expiresIn}</div>
                </div>
              </Link>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                  <span className="text-xs text-muted-foreground">الكود</span>
                  <span className="font-mono font-black text-lg tracking-widest text-primary">{c.code}</span>
                </div>
                <button
                  onClick={() => handleCopy(c.code)}
                  className={`h-12 px-4 rounded-2xl font-bold text-sm transition flex items-center gap-2 ${
                    isCopied ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isCopied ? <><Check className="w-4 h-4" /> نُسخ</> : <><Copy className="w-4 h-4" /> نسخ</>}
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`🏟️ *كوبون ${s?.name}*\n${c.title}\nالكود: *${c.code}*\n${c.description}\nينتهي: ${c.expiresIn}\n\nمن تطبيق HkeeemAI`);
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  className="h-12 px-3 rounded-2xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 flex items-center gap-1.5"
                  aria-label="مشاركة واتساب"
                >
                  <MessageCircle className="w-4 h-4" />
                  واتساب
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-16">لا توجد كوبونات مطابقة.</div>
      )}

      <ShareSheet
        open={share.open}
        onClose={() => setShare((s) => ({ ...s, open: false }))}
        title={share.title}
        text={share.text}
        url={share.url}
      />
    </div>
  );
}
