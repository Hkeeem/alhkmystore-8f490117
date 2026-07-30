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
    } catch { /* ignore */ }

    let ready = false;
    let raf = 0;
    const save = () => {
      if (!ready || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          sessionStorage.setItem(PREFIX + keyRef.current, String(Math.round(window.scrollY)));
        } catch { /* ignore */ }
      });
    };

    let cancelled = false;
    const start = performance.now();
    const restore = () => {
      if (cancelled) return;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      window.scrollTo({ top: Math.min(target, max), behavior: "instant" as ScrollBehavior });
      // نستمر بالمحاولة حتى يكتمل ارتفاع المحتوى (صور/بيانات) أو تنتهي المهلة
      if (max < target && performance.now() - start < 1500) {
        requestAnimationFrame(restore);
      } else {
        ready = true;
      }
    };
    requestAnimationFrame(restore);

    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelled = true;
      ready = true;
      save();
      window.removeEventListener("scroll", save);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);

  return null;
}
