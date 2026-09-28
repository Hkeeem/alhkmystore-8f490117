import { useMemo, useState } from "react";
import { Copy, Check, Ticket } from "lucide-react";
import { toast } from "sonner";
import { trackCouponClick } from "@/lib/track-deal";

export const NOON_CODES = ["HKEEEM2", "JQUDQ", "XTMSM", "IVQVQ", "ACOCS"] as const;

/** كوبونات حملة نون — تُعرض عند إتمام سلة المقاضي، ويُقترح كود مختلف لكل مستخدم لتوزيع الاستخدام. */
export function NoonCouponsPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const suggested = useMemo(() => NOON_CODES[Math.floor(Math.random() * NOON_CODES.length)], []);
  const codes = [suggested, ...NOON_CODES.filter((c) => c !== suggested)];

  const copy = async (code: string) => {
    trackCouponClick({ couponId: `noon-${code}`, code, title: "كاش باك 10% من نون", storeId: "noon", storeName: "نون", surface: "smart-list" });
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(`تم نسخ الكود ${code}`);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("تعذّر نسخ الكود");
    }
  };

  return (
    <section className="rounded-3xl border border-primary/30 bg-primary/5 p-4 mt-4" dir="rtl">
      <div className="flex items-center gap-2 mb-1">
        <Ticket className="w-5 h-5 text-primary" />
        <h3 className="font-black">كوبونات نون لسلتك</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        كاش باك 10% حتى 75 ر.س · سارية حتى 31 ديسمبر 2026
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {codes.map((code) => (
          <div key={code} className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card px-3 py-2">
            <span className="font-mono font-black tracking-widest text-primary flex-1">{code}</span>
            {code === suggested && (
              <span className="text-[10px] rounded-full bg-primary/15 text-primary px-2 py-0.5 font-bold">مقترح لك</span>
            )}
            <button
              onClick={() => copy(code)}
              className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1"
            >
              {copied === code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === code ? "نُسخ" : "نسخ"}
            </button>
          </div>
        ))}
      </div>
      <a
        href="https://www.noon.com/saudi-ar/"
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        onClick={() => trackCouponClick({ couponId: `noon-${suggested}`, code: suggested, title: "كاش باك 10% من نون", storeId: "noon", storeName: "نون", surface: "smart-list" })}
        className="mt-3 block text-center rounded-2xl bg-secondary py-2.5 text-sm font-black"
      >
        أكمل الشراء من نون
      </a>
    </section>
  );
}
