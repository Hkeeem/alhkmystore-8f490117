import { recordDealClick } from "@/lib/deal-tracking.functions";
import { recordOfferClick } from "@/lib/offer-clicks.functions";

export function sessionId() {
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
  storeId?: string;
  surface: "list" | "map" | "detail" | "coupon";
  kind?: "click" | "view";
}) {
  if (typeof window === "undefined" || !input.dealId) return;
  const session = sessionId();
  const path = window.location.pathname;
  try {
    void recordDealClick({
      data: { ...input, kind: input.kind ?? "click", session, path },
    }).catch(() => {
      /* تجاهل */
    });
    void recordOfferClick({
      data: {
        kind: "offer",
        offerId: input.dealId,
        offerTitle: input.title,
        storeId: input.storeId,
        storeName: input.storeName,
        surface: input.surface,
        session,
        path,
      },
    }).catch(() => {
      /* تجاهل */
    });
  } catch {
    /* تجاهل */
  }
}

/** تسجيل نقرة على كوبون (نسخ الكود أو فتح المتجر) */
export function trackCouponClick(input: {
  couponId: string;
  code?: string;
  title?: string;
  storeId?: string;
  storeName?: string;
  surface?: "coupon" | "coupon-detail";
}) {
  if (typeof window === "undefined" || !input.couponId) return;
  try {
    void recordOfferClick({
      data: {
        kind: "coupon",
        offerId: input.couponId,
        offerTitle: input.title,
        couponCode: input.code,
        storeId: input.storeId,
        storeName: input.storeName,
        surface: input.surface ?? "coupon",
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
