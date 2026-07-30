import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * يحفظ موضع التمرير لكل صفحة (حسب مفتاح السجل) ويعيده عند الرجوع/التقدّم،
 * ويبدأ من الأعلى عند فتح صفحة جديدة. يعمل حتى مع إعادة تركيب المحتوى
 * بسبب حركة الانتقال بين الصفحات.
 */
export function ScrollMemory() {
  const location = useRouterState({ select: (s) => s.location });
  const key = `${(location.state as { key?: string } | undefined)?.key ?? ""}|${location.href}`;
  const currentKey = useRef(key);

  // حفظ الموضع أثناء التمرير
  useEffect(() => {
    currentKey.current = key;
    let raf = 0;
    const save = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          sessionStorage.setItem(`hkeeem-scroll:${currentKey.current}`, String(window.scrollY));
        } catch { /* ignore */ }
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      save();
      window.removeEventListener("scroll", save);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);

  // استعادة الموضع عند تغيّر الصفحة
  useEffect(() => {
    let stored = 0;
    try {
      stored = Number(sessionStorage.getItem(`hkeeem-scroll:${key}`) ?? 0) || 0;
    } catch { /* ignore */ }

    if (stored <= 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }

    let cancelled = false;
    const start = performance.now();
    const tryRestore = () => {
      if (cancelled) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.min(stored, Math.max(max, 0)), behavior: "instant" as ScrollBehavior });
      // نستمر بالمحاولة حتى يكتمل ارتفاع المحتوى (صور/بيانات) أو تنتهي المهلة
      if (max < stored && performance.now() - start < 1200) {
        requestAnimationFrame(tryRestore);
      }
    };
    requestAnimationFrame(tryRestore);
    return () => { cancelled = true; };
  }, [key]);

  return null;
}
