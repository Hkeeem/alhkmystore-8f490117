import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reportCouponIssue } from "@/lib/offer-clicks.functions";
import { sessionId } from "@/lib/track-deal";

const REASONS: { id: string; label: string }[] = [
  { id: "not_working", label: "الكود لا يعمل" },
  { id: "expired", label: "الكود منتهي" },
  { id: "wrong_price", label: "الخصم مختلف عن المعروض" },
  { id: "other", label: "سبب آخر" },
];

/** زر «الكوبون لا يعمل» — يسجّل بلاغاً يظهر في شاشة مراقبة البلاغات */
export function CouponReportButton({
  couponId,
  code,
  storeId,
  storeName,
  siteUrl,
  offerUrl,
  compact,
}: {
  couponId: string;
  code?: string;
  storeId?: string;
  storeName?: string;
  siteUrl?: string;
  offerUrl?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("not_working");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    setSending(true);
    try {
      await reportCouponIssue({
        data: {
          couponId,
          couponCode: code,
          storeId,
          storeName,
          siteUrl: siteUrl ?? (typeof window !== "undefined" ? window.location.href : ""),
          offerUrl,
          reason,
          note,
          session: sessionId(),
        },
      });
      setDone(true);
      setOpen(false);
      toast.success("وصلنا بلاغك، سنراجع الكود فوراً");
    } catch {
      toast.error("تعذّر إرسال البلاغ، حاول لاحقاً");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p className="mt-2 text-[11px] text-muted-foreground text-center">
        شكراً لك، البلاغ قيد المراجعة.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-1.5 rounded-2xl border border-border/60 text-muted-foreground hover:text-foreground transition ${
          compact ? "px-3 py-2 text-[11px]" : "px-4 py-2.5 text-xs"
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        الكوبون لا يعمل؟
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                  reason === r.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="تفاصيل إضافية (اختياري)"
            className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs"
          />
          <button
            type="button"
            disabled={sending}
            onClick={send}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-xs font-black disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            إرسال البلاغ
          </button>
        </div>
      )}
    </div>
  );
}
