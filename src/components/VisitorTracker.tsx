import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { recordVisit } from "@/lib/visits.functions";

const KEY = "hkeeem-visit-session";

function sessionId() {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** يسجّل زيارة كل صفحة لتظهر في لوحة الزوار (بدون بيانات شخصية) */
export function VisitorTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const track = useServerFn(recordVisit);
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/api")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    void track({
      data: { path: pathname, session: sessionId(), referrer: document.referrer || "" },
    }).catch(() => {
      /* التتبع لا يوقف التطبيق */
    });
  }, [pathname, track]);

  return null;
}
