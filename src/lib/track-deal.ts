import { recordDealClick } from "@/lib/deal-tracking.functions";
import { recordOfferClick } from "@/lib/offer-clicks.functions";

export type TrackEventType =
  | "click"
  | "coupon_copy"
  | "store_click"
  | "detail_view"
  | "share"
  | "favorite";

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

/** منع تسجيل نفس الحدث مرتين عند الضغطة الواحدة */
const recent = new Map<string, number>();
function isDuplicate(key: string, windowMs = 2000) {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < windowMs) return true;
  recent.set(key, now);
  if (recent.size > 200) {
    for (const [k, at] of recent) if (now - at > 60_000) recent.delete(k);
  }
  return false;
}

/**
 * تسجيل حدث تفاعل مع عرض أو كوبون (نسخ كود، فتح متجر، عرض تفاصيل، مشاركة، مفضلة).
 * لا يحتوي بيانات شخصية، والفشل يُتجاهل حتى لا يعطّل الواجهة.
 */
export function trackOfferEvent(input: {
  eventType: TrackEventType;
  kind?: "offer" | "coupon";
  offerId: string;
  offerTitle?: string;
  storeId?: string;
  storeName?: string;
  couponCode?: string;
  surface?: "list" | "map" | "detail" | "coupon" | "coupon-detail" | "home";
}) {
  if (typeof window === "undefined" || !input.offerId) return;
  const surface = input.surface ?? "list";
  if (isDuplicate(`${input.eventType}:${input.offerId}:${surface}`)) return;
  try {
    void recordOfferClick({
      data: {
        kind: input.kind ?? "offer",
        eventType: input.eventType,
        offerId: input.offerId,
        offerTitle: input.offerTitle,
        storeId: input.storeId,
        storeName: input.storeName,
        couponCode: input.couponCode,
        surface,
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

/**
 * تسجيل نقرة على عرض من الخريطة أو القائمة أو صفحة التفاصيل.
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
  if (isDuplicate(`deal:${input.dealId}:${input.surface}:${input.kind ?? "click"}`)) return;
  try {
    void recordDealClick({
      data: { ...input, kind: input.kind ?? "click", session, path },
    }).catch(() => {
      /* تجاهل */
    });
    void recordOfferClick({
      data: {
        kind: "offer",
        eventType: input.kind === "view" ? "detail_view" : "click",
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
  eventType?: TrackEventType;
}) {
  trackOfferEvent({
    eventType: input.eventType ?? "coupon_copy",
    kind: "coupon",
    offerId: input.couponId,
    offerTitle: input.title,
    couponCode: input.code,
    storeId: input.storeId,
    storeName: input.storeName,
    surface: input.surface ?? "coupon",
  });
}
