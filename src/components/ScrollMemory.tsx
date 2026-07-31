import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

const PREFIX = "hkeeem-scroll:";

// حالة مشتركة لا تتأثر بإعادة تشغيل الـ effect (الراوتر قد يحدّث الموقع أكثر من مرة)
const state = {
  frozen: false,
  intentY: -1,
  intentAt: 0,
};

function write(key: string, y: number) {
  try {
    sessionStorage.setItem(PREFIX + key, String(Math.max(0, Math.round(y))));
  } catch { /* ignore */ }
}

/**
 * يحفظ موضع التمرير لكل إدخال في سجل التصفح ويعيده عند الرجوع/التقدّم
 * (مثلاً: الرجوع من صفحة تفاصيل العرض إلى المتجر/المعرض/المكتب)،
 * ويبدأ من أعلى الصفحة عند فتح صفحة جديدة.
 */
export function ScrollMemory() {
  const router = useRouter();
  const location = useRouterState({ select: (s) => s.location });
  const key = `${(location.state as { key?: string } | undefined)?.key ?? ""}|${location.pathname}${location.searchStr ?? ""}`;

  useEffect(() => {
    let target = 0;
    try {
      target = Number(sessionStorage.getItem(PREFIX + key) ?? 0) || 0;
    } catch { /* ignore */ }

    let ready = false;
    let raf = 0;
    let cancelled = false;

    state.frozen = false;
    state.intentY = -1;

    const save = () => {
      if (!ready || state.frozen || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (state.frozen) return;
        write(key, window.scrollY);
      });
    };

    // نلتقط الموضع لحظة النقر على رابط/زر ثم نجمّد الحفظ حتى لا يُكتب موضع الصفر
    const onIntent = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest?.("a[href], button, [role='link'], [role='button']")) return;
      state.intentY = window.scrollY;
      state.intentAt = performance.now();
      if (ready) write(key, state.intentY);
      state.frozen = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    // تمرير حقيقي من المستخدم يلغي التجميد
    const onUserScroll = () => {
      if (cancelled) return;
      state.frozen = false;
      state.intentY = -1;
    };

    if (target <= 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      setTimeout(() => { ready = true; }, 400);
    } else {
      const start = performance.now();
      const restore = () => {
        if (cancelled) return;
        const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const goal = Math.min(target, max);
        if (Math.abs(window.scrollY - goal) > 1) {
          window.scrollTo({ top: goal, behavior: "instant" as ScrollBehavior });
        }
        if (performance.now() - start < 900) {
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
        const recent = state.intentY >= 0 && performance.now() - state.intentAt < 5000;
        write(key, recent ? state.intentY : window.scrollY);
      }
      state.frozen = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });

    document.addEventListener("pointerdown", onIntent, true);
    document.addEventListener("keydown", onIntent, true);
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("scroll", save, { passive: true });

    return () => {
      cancelled = true;
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
