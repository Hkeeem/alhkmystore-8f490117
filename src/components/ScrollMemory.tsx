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
    // آخر موضع مؤكد للمستخدم قبل أي نقرة تنقّل
    let intentY = -1;
    let intentAt = 0;

    const write = (y: number) => {
      try {
        sessionStorage.setItem(PREFIX + key, String(Math.max(0, Math.round(y))));
      } catch { /* ignore */ }
    };

    const save = () => {
      // بعد النقر على رابط/زر نتوقف عن الحفظ حتى لا يُكتب موضع الصفر
      if (!ready || frozen || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (frozen) return;
        write(window.scrollY);
      });
    };

    // نلتقط الموضع لحظة النقر على رابط أو زر (قبل أي تصفير للتمرير)
    const onIntent = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest?.("a[href], button, [role='link'], [role='button']")) return;
      intentY = window.scrollY;
      intentAt = performance.now();
      if (ready) write(intentY);
      // أوقف الحفظ التلقائي حتى يمرّر المستخدم مجدداً أو يغادر الصفحة
      frozen = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    // تمرير حقيقي من المستخدم يلغي التجميد
    const onUserScroll = () => {
      if (!cancelled) {
        frozen = false;
        intentY = -1;
      }
    };



    let cancelled = false;
    if (target <= 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      setTimeout(() => { ready = true; }, 400);
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

    // ثبّت آخر موضع فعلي للمستخدم لحظة بدء أي تنقل
    const unsubscribe = router.subscribe("onBeforeNavigate", () => {
      if (ready) {
        const recentIntent = intentY >= 0 && performance.now() - intentAt < 3000;
        write(recentIntent ? intentY : window.scrollY);
      }
      frozen = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });

    document.addEventListener("pointerdown", onIntent, true);
    document.addEventListener("keydown", onIntent, true);
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("scroll", save, { passive: true });

    return () => {
      cancelled = true;
      frozen = true;
      ready = false;
      unsubscribe();
      document.removeEventListener("pointerdown", onIntent, true);
      document.removeEventListener("keydown", onIntent, true);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("scroll", save);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key, router]);

  return null;
}
