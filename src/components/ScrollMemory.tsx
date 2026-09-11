import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

const PREFIX = "hkeeem-scroll:";

/**
 * يحفظ موضع التمرير لكل إدخال في سجل التصفح ويعيده عند الرجوع/التقدّم،
 * ويبدأ من أعلى الصفحة عند فتح صفحة جديدة. يعمل حتى مع إعادة تركيب
 * المحتوى بسبب حركة الانتقال بين الصفحات.
 */
export function ScrollMemory() {
  const location = useRouterState({ select: (s) => s.location });
  const key = `${(location.state as { key?: string } | undefined)?.key ?? ""}|${location.pathname}${location.searchStr ?? ""}`;
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;

    // 1) اقرأ الموضع المحفوظ قبل تسجيل أي حفظ جديد
    let target = 0;
    try {
      target = Number(sessionStorage.getItem(PREFIX + key) ?? 0) || 0;
    } catch {
      /* ignore */
    }

    let ready = false;
    let raf = 0;
    const save = () => {
      if (!ready || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          sessionStorage.setItem(PREFIX + keyRef.current, String(Math.round(window.scrollY)));
        } catch {
          /* ignore */
        }
      });
    };

    let cancelled = false;
    if (target <= 0) {
      // صفحة جديدة: ابدأ من الأعلى ثم اسمح بالحفظ فوراً
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      ready = true;
    } else {
      const start = performance.now();
      const restore = () => {
        if (cancelled) return;
        const elapsed = performance.now() - start;
        const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const goal = Math.min(target, max);
        // نُعيد التطبيق كل إطار خلال نافذة قصيرة، لأن ارتفاع المحتوى قد يتغيّر
        // بعد التركيب (بيانات/صور/حركة الانتقال) فيقصّ المتصفح الموضع.
        if (window.scrollY < goal - 1) {
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

    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelled = true;
      // لا نحفظ عند الخروج: المتصفح قد يكون صفّر التمرير مسبقاً فيُتلف القيمة المحفوظة
      ready = false;
      window.removeEventListener("scroll", save);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);

  return null;
}
