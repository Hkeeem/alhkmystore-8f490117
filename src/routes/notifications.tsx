import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  BellRing,
  RotateCcw,
  TestTube2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/notifications")({
  component: NotificationSettingsPage,
  head: () => ({
    meta: [
      { title: "إعدادات الإشعارات | HkeeemAI" },
      {
        name: "description",
        content:
          "تحكّم في إشعارات HkeeemAI: فعّل تنبيهات العروض وانخفاض الأسعار، أوقفها، أو أعد طلب الإذن من المتصفح.",
      },
      { property: "og:title", content: "إعدادات الإشعارات | HkeeemAI" },
      {
        property: "og:description",
        content: "إيقاف أو تفعيل إشعارات العروض وتنبيهات الأسعار وإعادة طلب إذن المتصفح.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Bi = { ar: string; en: string };
const STATUS_META: Record<string, { label: Bi; tone: string; desc: Bi }> = {
  granted: {
    label: { ar: "مفعّلة", en: "Enabled" },
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    desc: {
      ar: "ستصلك تنبيهات العروض القوية وانخفاض الأسعار مباشرة على جهازك.",
      en: "You will receive strong deal and price-drop alerts directly on your device.",
    },
  },
  denied: {
    label: { ar: "محظورة من المتصفح", en: "Blocked by the browser" },
    tone: "border-red-500/40 bg-red-500/10 text-red-400",
    desc: {
      ar: "المتصفح حظر الإشعارات لهذا الموقع. لتفعيلها: افتح إعدادات الموقع في المتصفح (أيقونة القفل بجانب الرابط) واسمح بالإشعارات، ثم عد لهذه الصفحة.",
      en: "Your browser blocked notifications for this site. Open the site settings (the lock icon next to the address), allow notifications, then come back to this page.",
    },
  },
  default: {
    label: { ar: "لم يُطلب الإذن بعد", en: "Permission not requested yet" },
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    desc: {
      ar: "اضغط «تفعيل الإشعارات» وسيظهر لك طلب الإذن من المتصفح.",
      en: 'Tap "Enable notifications" and the browser will ask for permission.',
    },
  },
  unsupported: {
    label: { ar: "غير مدعومة", en: "Not supported" },
    tone: "border-border bg-muted/40 text-muted-foreground",
    desc: {
      ar: "متصفحك الحالي لا يدعم إشعارات الويب. جرّب متصفحًا حديثًا مثل Chrome أو Edge.",
      en: "This browser does not support web notifications. Try a modern browser such as Chrome or Edge.",
    },
  },
};

function NotificationSettingsPage() {
  const { permission, dismissed, isReady, request, reset } = useNotifications();
  const { t, lang } = useI18n();

  const status = STATUS_META[permission] ?? STATUS_META.default;

  const handleEnable = async () => {
    const result = await request();
    if (result === "granted") {
      toast.success("تم تفعيل الإشعارات بنجاح ✅");
    } else if (result === "denied") {
      toast.error("تم رفض الإذن — فعّله يدويًا من إعدادات الموقع في المتصفح.");
    } else {
      toast("لم يُحسم الإذن بعد.");
    }
  };

  const handleTest = () => {
    try {
      const n = new Notification("حكيم AI", {
        body: "هذه إشعار تجريبي — ستصلك تنبيهات العروض هنا.",
        icon: "/pwa-192x192.png",
      });
      n.onclick = () => window.focus();
      toast.success("تم إرسال إشعار تجريبي");
    } catch {
      toast.error("تعذّر إرسال الإشعار التجريبي.");
    }
  };

  const handleRePrompt = () => {
    reset();
    toast.success("تمت إعادة ضبط الطلب — سيظهر لك تلقائيًا في زيارتك القادمة.");
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          إعدادات الإشعارات
        </h1>
        <p className="text-muted-foreground text-sm">
          تحكّم في تنبيهات العروض وانخفاض الأسعار: فعّلها، أوقفها، أو أعد طلب الإذن.
        </p>
      </header>

      {/* حالة الإشعارات */}
      <section
        aria-labelledby="status-h"
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
      >
        <h2 id="status-h" className="font-bold flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary" />
          الحالة الحالية
        </h2>
        {isReady ? (
          <>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold ${status.tone}`}
              role="status"
            >
              {permission === "granted" ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              {status.label}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">{status.desc}</p>
          </>
        ) : (
          <div className="h-10 rounded-xl bg-muted/40 animate-pulse" aria-hidden="true" />
        )}
      </section>

      {/* التحكم */}
      <section
        aria-labelledby="controls-h"
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
      >
        <h2 id="controls-h" className="font-bold">
          التحكم
        </h2>
        <div className="flex flex-wrap gap-3">
          {permission !== "granted" && permission !== "unsupported" && (
            <button
              onClick={handleEnable}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Bell className="w-4 h-4" />
              تفعيل الإشعارات
            </button>
          )}
          {permission === "granted" && (
            <>
              <button
                onClick={handleTest}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95"
              >
                <TestTube2 className="w-4 h-4" />
                إرسال إشعار تجريبي
              </button>
              <div className="w-full rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed flex gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
                <span>
                  <strong className="text-foreground">لإيقاف الإشعارات نهائيًا:</strong> المتصفحات
                  لا تسمح للمواقع بإلغاء الإذن برمجيًا. افتح إعدادات الموقع (أيقونة القفل 🔒 بجانب
                  الرابط) ← الإشعارات ← حظر.
                </span>
              </div>
            </>
          )}
          {permission === "denied" && (
            <button
              onClick={() => toast("اتبع الخطوات الموضحة في الحالة أعلاه لإلغاء الحظر.")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              <ShieldAlert className="w-4 h-4" />
              كيف ألغي الحظر؟
            </button>
          )}
          {dismissed && permission === "default" && (
            <button
              onClick={handleRePrompt}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة إظهار طلب الإذن التلقائي
            </button>
          )}
        </div>
      </section>

      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        العودة إلى تخصيص المظهر
      </Link>
    </main>
  );
}
