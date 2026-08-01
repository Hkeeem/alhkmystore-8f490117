import { useEffect, useRef, useState } from "react";

export type Theme = "gold" | "silver" | "bronze";

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "gold", label: "الوضع الذهبي", swatch: "linear-gradient(135deg,#F6DE7A,#D4AF37,#8A5A00)" },
  { id: "silver", label: "الوضع الفضي", swatch: "linear-gradient(135deg,#F4F6F8,#C0C6CC,#7C858E)" },
  { id: "bronze", label: "الوضع البرونزي", swatch: "linear-gradient(135deg,#E8B98A,#B87333,#6B3F1D)" },
];

const KEY = "hkeeem-theme";
const AUTO_KEY = "hkeeem-theme-auto";
const EVT = "hkeeem:theme";
const CLASSES = ["theme-gold", "theme-silver", "theme-bronze"];

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return THEMES.some((t) => t.id === stored) ? (stored as Theme) : "gold";
  } catch {
    return "gold";
  }
}

function readAuto(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) === "1";
  } catch {
    return false;
  }
}

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * الثيمات المعدنية الثلاثة + خيار "تلقائي" يتبع تفضيل النظام
 * (فاتح/داكن) مع الاحتفاظ بآخر ثيم معدني اختاره المستخدم.
 */
export function useTheme() {
  // قيم ثابتة على الخادم والعميل لتفادي اختلاف الترطيب (hydration)
  const [theme, setThemeState] = useState<Theme>("gold");
  const [auto, setAutoState] = useState(false);
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readTheme());
    setAutoState(readAuto());
    setSystemDark(prefersDark());
    setReady(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onSystem);

    const sync = () => {
      setThemeState(readTheme());
      setAutoState(readAuto());
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);

    return () => {
      mq.removeEventListener("change", onSystem);
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;

    // انتقال ناعم للألوان عند التبديل (نتجاهله في أول تطبيق بعد التحميل)
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!firstApply.current) {
      root.classList.add("theme-switching");
      timer = setTimeout(() => root.classList.remove("theme-switching"), 480);
    }
    firstApply.current = false;

    root.classList.remove(...CLASSES, "dark");
    root.classList.add(`theme-${theme}`);
    // في الوضع التلقائي نتبع تفضيل النظام للوضع الداكن مع بقاء الثيم المعدني
    if (auto && systemDark) root.classList.add("dark");

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [theme, auto, systemDark, ready]);


  const persist = (next: { theme?: Theme; auto?: boolean }) => {
    try {
      if (next.theme) localStorage.setItem(KEY, next.theme);
      if (typeof next.auto === "boolean") localStorage.setItem(AUTO_KEY, next.auto ? "1" : "0");
      window.dispatchEvent(new Event(EVT));
    } catch {
      /* ignore */
    }
  };

  /** اختيار ثيم يدويًا يوقف الوضع التلقائي */
  const setTheme = (t: Theme) => {
    setThemeState(t);
    setAutoState(false);
    persist({ theme: t, auto: false });
  };

  /** تفعيل/إيقاف اتباع النظام — يعود لآخر ثيم محدد عند الإيقاف */
  const setAuto = (v: boolean) => {
    setAutoState(v);
    persist({ auto: v });
  };

  const cycle = () => {
    const next = THEMES[(THEMES.findIndex((x) => x.id === theme) + 1) % THEMES.length].id;
    setTheme(next);
  };

  return { theme, setTheme, auto, setAuto, systemDark, cycle, themes: THEMES, ready };
}
