import { useEffect, useRef, useState } from "react";
import { MessageSquareHeart, Star, X, Send, PartyPopper } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "hk_survey_responses_v1";
const DISMISSED_KEY = "hk_survey_dismissed_at";

const REASONS = [
  "العروض ممتازة",
  "سهل الاستخدام",
  "التصميم جميل",
  "المقارنات مفيدة",
  "بطيء أحياناً",
  "ينقصه عروض",
] as const;

interface SurveyResponse {
  rating: number;
  reasons: string[];
  comment: string;
  path: string;
  at: string;
}

function saveResponse(r: SurveyResponse) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: SurveyResponse[] = raw ? JSON.parse(raw) : [];
    list.push(r);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* تخزين محلي غير متاح */
  }
}

export function FeedbackSurvey() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<HTMLElement | null>(null);

  // بعد أن يتصفح الزائر قليلاً (10 ثوانٍ أو تمرير للأسفل):
  // - يُفتح الاستبيان تلقائياً مرة واحدة فقط لكل زائر
  // - ويبقى الزر العائم متاحاً لإعادة الفتح من داخل التطبيق
  useEffect(() => {
    if (typeof window === "undefined") return;
    const AUTO_KEY = "hk_survey_auto_shown";
    const openManually = () => setOpen(true);
    window.addEventListener("hk:open-survey", openManually);

    const show = () => {
      setVisible(true);
      // فتح تلقائي مرة واحدة فقط إذا لم يقيّم الزائر من قبل
      try {
        if (!localStorage.getItem(AUTO_KEY) && !localStorage.getItem(DISMISSED_KEY)) {
          localStorage.setItem(AUTO_KEY, String(Date.now()));
          setOpen(true);
        }
      } catch {
        /* تخزين محلي غير متاح */
      }
    };
    const t = window.setTimeout(show, 10_000);
    const onScroll = () => {
      if (window.scrollY > 400) {
        show();
        window.removeEventListener("scroll", onScroll);
        window.clearTimeout(t);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hk:open-survey", openManually);
    };
  }, []);

  // إدارة التركيز وإغلاق بـ Escape
  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement as HTMLElement;
    const el = dialogRef.current;
    el?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastActive.current?.focus?.();
    };
  }, [open]);

  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const submit = () => {
    if (rating === 0) {
      toast.error("اختر عدد النجوم أولاً");
      return;
    }
    saveResponse({
      rating,
      reasons,
      comment: comment.trim().slice(0, 500),
      path: window.location.pathname,
      at: new Date().toISOString(),
    });
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDone(true);
    toast.success("شكراً لتقييمك! رأيك يطوّر حكيم AI 🌟");
    window.setTimeout(() => {
      setOpen(false);
      setDone(false);
      setRating(0);
      setReasons([]);
      setComment("");
    }, 1800);
  };

  if (!visible) return null;

  return (
    <>
      {/* زر عائم دائم */}
      <button
        onClick={() => setOpen(true)}
        aria-label="قيّم تجربتك في حكيم AI"
        className="fixed bottom-24 md:bottom-6 left-4 z-40 flex items-center gap-2 rounded-full bg-gradient-gold text-secondary font-bold px-4 py-3 shadow-glow border border-primary/40 hover:scale-105 active:scale-95 transition-transform"
      >
        <MessageSquareHeart className="w-5 h-5" />
        <span className="text-sm leading-normal">قيّمنا</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="استبيان تقييم تجربة حكيم AI"
            className="w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-glow p-6 space-y-5 animate-in fade-in zoom-in-95"
          >
            {done ? (
              <div className="text-center py-8 space-y-3">
                <PartyPopper className="w-12 h-12 mx-auto text-primary" />
                <h2 className="font-black text-xl">شكراً لك! 🌟</h2>
                <p className="text-sm text-muted-foreground">
                  تقييمك وصلنا ويساعدنا نحسّن التوفير للجميع.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-black text-lg leading-snug">كيف كانت تجربتك؟</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      دقيقة واحدة تكفي — رأيك يصنع الفرق
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="إغلاق الاستبيان"
                    className="p-2 rounded-full hover:bg-muted transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* النجوم */}
                <div
                  className="flex justify-center gap-2"
                  role="radiogroup"
                  aria-label="تقييم بالنجوم"
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = n <= (hovered || rating);
                    return (
                      <button
                        key={n}
                        role="radio"
                        aria-checked={rating === n}
                        aria-label={`${n} نجوم`}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-9 h-9 transition ${active ? "text-primary fill-primary drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" : "text-muted-foreground/40"}`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* أسباب سريعة */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleReason(r)}
                      aria-pressed={reasons.includes(r)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition leading-normal ${
                        reasons.includes(r)
                          ? "bg-primary/15 text-primary border-primary/50"
                          : "bg-muted/50 text-muted-foreground border-border/60 hover:border-primary/40"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="أضف ملاحظة أو اقتراحاً (اختياري)…"
                  className="w-full bg-muted/40 border border-border/60 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-muted-foreground/70"
                />

                <button
                  onClick={submit}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-gold text-secondary font-black py-3 rounded-2xl hover:opacity-95 transition shadow-glow"
                >
                  <Send className="w-4 h-4" />
                  <span className="leading-normal">إرسال التقييم</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
