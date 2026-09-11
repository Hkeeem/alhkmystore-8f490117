import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/**
 * تسجيل أحداث تحسين التجربة داخل التطبيق (فتح الاستبيان، إتمامه، سبب الإغلاق…).
 * لا يحتوي على أي بيانات شخصية — فقط نوع الحدث وتفاصيله والصفحة.
 * فشل الإرسال يُتجاهل بصمت حتى لا يؤثر على تجربة المستخدم.
 */
export function trackEvent(event: string, payload: Record<string, unknown> = {}) {
  try {
    const row = {
      event,
      payload: payload as Json,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    };
    void Promise.resolve(supabase.from("analytics_events").insert(row)).catch(() => {
      /* تجاهل — التحليلات لا توقف التطبيق */
    });
  } catch {
    /* تجاهل */
  }
}

// ذاكرة مؤقتة لمنع تكرار تسجيل الحدث للضغطة الواحدة خلال فترة محددة
const recentEvents = new Set<string>();

interface TrackOfferEventParams {
  event: "offer_favorite_add" | "offer_view_details" | "coupon_copy";
  offerId?: string | number;
  storeId?: string | number;
  payload?: Record<string, unknown>;
  cooldownMs?: number; // مدة منع التكرار بالمللي ثانية (افتراضياً ثانيتان)
}

/**
 * تسجيل أحداث العروض (إضافة للمفضلة، فتح التفاصيل، نسخ الكوبون)
 * مزودة بآلية منع التكرار السريع لنفس العنصر لنفس الحدث.
 */
export function trackOfferEvent({
  event,
  offerId,
  storeId,
  payload = {},
  cooldownMs = 2000,
}: TrackOfferEventParams) {
  const targetId = offerId ?? storeId ?? "generic";
  const debounceKey = `${event}:${targetId}`;

  // إذا تم الضغط على نفس العنصر خلال فترة الـ Cooldown يتم تجاهله
  if (recentEvents.has(debounceKey)) {
    return;
  }

  recentEvents.add(debounceKey);
  setTimeout(() => {
    recentEvents.delete(debounceKey);
  }, cooldownMs);

  // إرسال الحدث إلى جدول analytics_events بصمت
  trackEvent(event, {
    offer_id: offerId,
    store_id: storeId,
    ...payload,
  });
}
