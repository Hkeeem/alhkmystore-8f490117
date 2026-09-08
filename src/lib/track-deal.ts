import { recordDealClick } from "@/lib/deal-tracking.functions";

function sessionId() {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem("hk_session");
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("hk_session", s);
    }
    return s;
  } catch {
    return "";
  }
}

/**
 * تسجيل نقرة على عرض من الخريطة أو القائمة أو صفحة التفاصيل.
 * لا يحتوي بيانات شخصية، والفشل يُتجاهل حتى لا يعطّل فتح العرض.
 */
export function trackDealClick(input: {
  dealId: string;
  title?: string;
  storeName?: string;
  surface: "list" | "map" | "detail" | "coupon";
  kind?: "click" | "view";
}) {
  if (typeof window === "undefined" || !input.dealId) return;
  try {
    void recordDealClick({
      data: {
        ...input,
        kind: input.kind ?? "click",
        session: sessionId(),
        path: window.location.pathname,
      },
    }).catch(() => {
      /* تجاهل */
    });
  } catch {
    /* تجاهل */
  }
}
