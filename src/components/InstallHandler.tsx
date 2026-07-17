import { useEffect, useState } from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import { Download, X, Smartphone } from "lucide-react";

const PENDING_KEY = "waffar_pending_deeplink";
const DISMISS_KEY = "waffar_install_dismissed_at";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

export function InstallHandler() {
  const router = useRouter();
  const location = useLocation();
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  // 1) Persist the current deep link so it can be reopened post-install.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname + window.location.search;
    if (path !== "/" && !path.startsWith("/?")) {
      try { localStorage.setItem(PENDING_KEY, path); } catch { /* noop */ }
    }
  }, [location.pathname, location.searchStr]);

  // 2) When launched as PWA, resume the saved deep link.
  useEffect(() => {
    if (typeof window === "undefined" || !isStandalone()) return;
    try {
      const current = window.location.pathname + window.location.search;
      const target = localStorage.getItem(PENDING_KEY);
      if (target && target !== current) {
        localStorage.removeItem(PENDING_KEY);
        router.navigate({ to: target });
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // 3) Capture install prompt + iOS fallback banner.
  useEffect(() => {
    if (typeof window === "undefined" || isStandalone()) return;
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
      if (!recentlyDismissed) setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setBip(null);
      try { localStorage.removeItem(DISMISS_KEY); } catch { /* noop */ }
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show a hint on deep-linked pages.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    const onDeepLink = location.pathname.startsWith("/deals/") || location.pathname === "/smart-list";
    if (isIos && onDeepLink && !recentlyDismissed) {
      setIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [location.pathname]);

  async function install() {
    if (!bip) return;
    await bip.prompt();
    const choice = await bip.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 inset-x-3 md:inset-x-auto md:right-6 md:max-w-sm z-40 bg-card border border-border shadow-glow rounded-3xl p-4 animate-in slide-in-from-bottom">
      <button onClick={dismiss} aria-label="إغلاق" className="absolute top-2 left-2 w-7 h-7 rounded-full hover:bg-secondary flex items-center justify-center">
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-hero text-primary-foreground flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-black text-sm">ثبّت وفّر على جوّالك</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {iosHint
              ? "افتح قائمة المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية». نرجعك لنفس هذه الصفحة بعد التثبيت."
              : "ثبّت التطبيق ونرجعك لنفس هذه الصفحة تلقائياً بعد التثبيت."}
          </p>
          {!iosHint && bip && (
            <button
              onClick={install}
              className="mt-3 inline-flex items-center gap-1.5 bg-gradient-hero text-primary-foreground px-4 py-2 rounded-2xl text-xs font-bold shadow-soft"
            >
              <Download className="w-3.5 h-3.5" />
              تثبيت الآن
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
