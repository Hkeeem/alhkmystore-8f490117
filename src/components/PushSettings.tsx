import { BellRing, BellOff, Loader2, Send, ShieldAlert, Smartphone, Info } from "lucide-react";
import { toast } from "sonner";
import { usePush, type PushSupport } from "@/hooks/use-push";

const UNSUPPORTED_COPY: Record<
  Exclude<PushSupport, "supported" | "checking">,
  { title: string; why: string }
> = {
  "insecure-context": {
    title: "الاتصال غير آمن",
    why: "إشعارات الويب تعمل فقط على روابط HTTPS. افتح الموقع عبر https://alhkmy.store ثم أعد المحاولة.",
  },
  "no-notification-api": {
    title: "متصفحك لا يدعم إشعارات الويب",
    why: "المتصفح الحالي لا يوفّر واجهة الإشعارات (شائع في متصفحات داخل التطبيقات مثل انستقرام أو فيسبوك أو سناب شات).",
  },
  "no-service-worker": {
    title: "متصفحك لا يدعم عامل الخدمة",
    why: "الإشعارات في الخلفية تحتاج Service Worker، وهو غير متاح في وضع التصفح المتخفي أو بعض المتصفحات القديمة.",
  },
  "no-push-api": {
    title: "الإشعارات الخلفية غير متاحة هنا",
    why: "متصفحك لا يدعم Push API. على iPhone/iPad يعمل الدعم فقط من داخل Safari وبعد إضافة التطبيق للشاشة الرئيسية (iOS 16.4 فأحدث).",
  },
};

const STEPS = [
  "افتح الموقع في Safari (آيفون/آيباد) أو Chrome/Edge (أندرويد وكمبيوتر) — وليس من داخل تطبيق آخر.",
  "على الآيفون: اضغط زر المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من الأيقونة الجديدة.",
  "ارجع لهذه الصفحة واضغط «تفعيل إشعارات العروض» ثم اسمح بالإذن عند ظهور طلب المتصفح.",
  "اضغط «إرسال إشعار تجريبي» للتأكد من وصول الإشعار فعليًا لجهازك.",
];

export function PushSettings() {
  const { support, subscribed, busy, serverConfigured, subscribe, unsubscribe, test } = usePush();

  const handleSubscribe = async () => {
    const res = await subscribe();
    if (res.ok) {
      toast.success("تم الاشتراك في إشعارات العروض ✅");
      return;
    }
    if (res.reason === "denied") toast.error("رُفض الإذن — فعّله من إعدادات الموقع في المتصفح 🔒");
    else if (res.reason === "server_not_configured")
      toast.error("خدمة الإشعارات غير مهيّأة على الخادم حاليًا.");
    else if (res.reason === "no_sw")
      toast.error("تعذّر تشغيل عامل الخدمة — جرّب من الموقع المنشور.");
    else toast("لم يكتمل الاشتراك، حاول مرة أخرى.");
  };

  const handleTest = async () => {
    const res = await test();
    if (res.ok) toast.success("أُرسل الإشعار — تحقق من جهازك خلال ثوانٍ 🔔");
    else if (res.reason === "expired") toast.error("انتهت صلاحية الاشتراك، أعد التفعيل.");
    else toast.error("تعذّر إرسال الإشعار حاليًا.");
  };

  const handleOff = async () => {
    await unsubscribe();
    toast.success("تم إيقاف إشعارات العروض على هذا الجهاز.");
  };

  return (
    <section
      aria-labelledby="push-h"
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <h2 id="push-h" className="font-bold flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-primary" />
        إشعارات Push الحقيقية (تعمل والتطبيق مغلق)
      </h2>

      {support === "checking" && (
        <div className="h-10 rounded-xl bg-muted/40 animate-pulse" aria-hidden="true" />
      )}

      {support === "supported" && (
        <>
          <span
            role="status"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold ${
              subscribed
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/40 bg-amber-500/10 text-amber-400"
            }`}
          >
            {subscribed ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {subscribed ? "مشترك في إشعارات العروض" : "غير مشترك بعد"}
          </span>

          {!serverConfigured && (
            <p className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              خدمة الإرسال غير مهيّأة على الخادم حاليًا — الاشتراك لن يستقبل إشعارات حتى تُضبط.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {!subscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                تفعيل إشعارات العروض
              </button>
            ) : (
              <>
                <button
                  onClick={handleTest}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  إرسال إشعار تجريبي
                </button>
                <button
                  onClick={handleOff}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted disabled:opacity-60"
                >
                  <BellOff className="w-4 h-4" />
                  إيقاف على هذا الجهاز
                </button>
              </>
            )}
          </div>

          <p className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            الإشعارات الفعلية تعمل على الموقع المنشور فقط، ولا تعمل داخل معاينة المحرر.
          </p>
        </>
      )}

      {support !== "supported" && support !== "checking" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {UNSUPPORTED_COPY[support].title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {UNSUPPORTED_COPY[support].why}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold">خطوات التفعيل المطلوبة منك:</p>
            <ol className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
