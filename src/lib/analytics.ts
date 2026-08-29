import { supabase } from "@/integrations/supabase/client";

/**
 * تسجيل أحداث تحسين التجربة داخل التطبيق (فتح الاستبيان، إتمامه، سبب الإغلاق…).
 * لا يحتوي على أي بيانات شخصية — فقط نوع الحدث وتفاصيله والصفحة.
 * فشل الإرسال يُتجاهل بصمت حتى لا يؤثر على تجربة المستخدم.
 */
export function trackEvent(event: string, payload: Record<string, unknown> = {}) {
  try {
    const row = {
      event,
      payload,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    };
    void Promise.resolve(
      supabase.from("analytics_events").insert(row),
    ).catch(() => {
      /* تجاهل — التحليلات لا توقف التطبيق */
    });
  } catch {
    /* تجاهل */
  }
}
