import { useEffect, useRef } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

const PREFIX = "hkeeem-scroll:";

/**
 * يحفظ موضع التمرير لكل إدخال في سجل التصفح ويعيده عند الرجوع/التقدّم،
 * ويبدأ من أعلى الصفحة عند فتح صفحة جديدة.
 */
export function ScrollMemory() {
  const router = useRouter();
  const location = useRouterState({ select: (s) => s.location });
  const key = `${(location.state as { key?: string } | undefined)?.key ?? ""}|${location.pathname}${location.searchStr ?? ""}`;
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;

    let target = 0;
    try {
      target = Number(sessionStorage.getItem(PREFIX + key) ?? 0) || 0;
    } catch { /* ignore */ }

    // frozen: يمنع أي حفظ بعد بدء التنقل (المتصفح يصفّر التمرير عندها)
    let frozen = false;
    let ready = false;
    let raf = 0;

    const save = () => {
      if (!ready || frozen || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (frozen) return;
        try {
          sessionStorage.setItem(PREFIX + keyRef.current, String(Math.round(window.scrollY)));
        } catch { /* ignore */ }
      });
    };

    let cancelled = false;
    if (target <= 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      ready = true;
    } else {
      const start = performance.now();
      const restore = () => {
        if (cancelled) return;
        const elapsed = performance.now() - start;
        const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const goal = Math.min(target, max);
        if (Math.abs(window.scrollY - goal) > 1) {
          window.scrollTo({ top: goal, behavior: "instant" as ScrollBehavior });
        }
        if (elapsed < 900) {
          requestAnimationFrame(restore);
        } else {
          ready = true;
        }
      };
      requestAnimationFrame(restore);
    }

    // جمّد الحفظ لحظة بدء أي تنقل، بعد تثبيت آخر موضع فعلي للمستخدم
    const unsubscribe = router.subscribe("onBeforeNavigate", () => {
      if (ready && !frozen) {
        try {
          sessionStorage.setItem(PREFIX + keyRef.current, String(Math.round(window.scrollY)));
        } catch { /* ignore */ }
      }
      frozen = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });

    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelled = true;
      frozen = true;
      ready = false;
      unsubscribe();
      window.removeEventListener("scroll", save);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key, router]);

  return null;
}
