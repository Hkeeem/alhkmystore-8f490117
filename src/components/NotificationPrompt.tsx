import { useEffect, useState } from "react";
import { Bell, X, BellRing } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

export function NotificationPrompt() {
  const { permission, dismissed, isReady, request, dismiss } = useNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    // Show only if permission is undecided and user hasn't dismissed
    if (permission === "default" && !dismissed) {
      const timer = window.setTimeout(() => setVisible(true), 2500);
      return () => window.clearTimeout(timer);
    }
    setVisible(false);
  }, [permission, dismissed, isReady]);

  if (!visible) return null;

  const handleEnable = async () => {
    const result = await request();
    if (result === "granted") {
      toast.success("تم تفعيل الإشعارات", {
        description: "سنرسل لك تنبيهات بأفضل العروض والكوبونات الجديدة.",
        icon: <BellRing className="w-4 h-4" />,
      });
    } else if (result === "denied") {
      toast.info("تم حظر الإشعارات", {
        description: "يمكنك تفعيلها لاحقًا من إعدادات المتصفح.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="طلب السماح بالإشعارات"
      className="fixed bottom-[4.5rem] left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-[28rem]"
    >
      <div className="hk-card overflow-hidden border border-primary/30 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.35)] bg-background/95 backdrop-blur-xl p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm md:text-base leading-snug">
              لا تفوّت أفضل العروض
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
              فعّل الإشعارات ليصلك تنبيه فوري بأقوى العروض والكوبونات الجديدة من حكيم AI.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleEnable}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <BellRing className="w-4 h-4" />
                تفعيل الإشعارات
              </button>
              <button
                onClick={() => { dismiss(); setVisible(false); }}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                لاحقًا
              </button>
            </div>
          </div>
          <button
            onClick={() => { dismiss(); setVisible(false); }}
            aria-label="إغلاق"
            className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
