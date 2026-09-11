/**
 * تنبيه داخلي تلقائي عند تكرار فشل واجهة منصة حكيم (مثل 500 على /api/v1/offers).
 * يسجّل الحدث في sync_events ثم يعيد استخدام منظومة التنبيهات الموحّدة
 * (إشعارات داخلية + بريد + Slack) عند نفاد المحاولات.
 */

export const HKEEEM_SOURCE = "hkeeem_catalog";

let hadFailure = false;

/** يسجّل نجاحًا (مرة واحدة فقط بعد سلسلة إخفاقات) لإغلاق سلسلة التنبيه */
export async function recordHkeeemSuccess(count: number) {
  if (!hadFailure) return;
  hadFailure = false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sync_events").insert({
      source: HKEEEM_SOURCE,
      status: "success",
      code: "ok",
      message: `تم جلب ${count} عنصرًا من منصة حكيم`,
    });
  } catch (error) {
    console.error("[hkeeem] success event insert failed", error);
  }
}

/** يسجّل فشلًا ويطلق التنبيه الداخلي عند تكرار الإخفاق */
export async function recordHkeeemFailure(input: {
  path: string;
  status: number | null;
  reason: string;
}) {
  hadFailure = true;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code =
      input.status === null
        ? input.reason === "hkeeem-not-configured"
          ? "missing_keys"
          : "network_error"
        : input.status === 401 || input.status === 403
          ? "auth_error"
          : input.status === 429
            ? "throttled"
            : "http_error";

    await supabaseAdmin.from("sync_events").insert({
      source: HKEEEM_SOURCE,
      status: "failure",
      code,
      keyword: input.path,
      message: `استجابة ${input.status ?? "بدون"} من ${input.path}`,
    });

    const { maybeAlertSyncFailure } = await import("@/lib/sync-alerts.server");
    await maybeAlertSyncFailure({
      source: HKEEEM_SOURCE,
      code,
      message: `منصة حكيم ترجع خطأ ${input.status ?? "اتصال"} على ${input.path}`,
      keyword: input.path,
    });
  } catch (error) {
    console.error("[hkeeem] failure alert failed", error);
  }
}
