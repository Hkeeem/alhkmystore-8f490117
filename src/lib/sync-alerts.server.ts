/**
 * تنبيهات تلقائية للفريق الإداري عند نفاد محاولات إعادة المحاولة
 * وفشل المزامنة النهائي لمصدر معيّن (Amazon / noon).
 */

/** عدد المحاولات المتتالية الفاشلة التي تُعد "نفاد المحاولات" */
export const MAX_SYNC_ATTEMPTS = 3;

const CODE_LABELS: Record<string, string> = {
  missing_keys: "مفاتيح الربط ناقصة",
  auth_error: "بيانات المصادقة غير صالحة",
  partner_tag_invalid: "Partner Tag غير صالح",
  throttled: "تجاوز حد الطلبات (Throttling)",
  http_error: "استجابة غير ناجحة من المصدر",
  network_error: "تعذّر الاتصال بالمصدر",
  upsert_failed: "فشل حفظ العروض في قاعدة البيانات",
  empty_result: "لم تُرجع الدورة أي عروض",
};

const SOURCE_LABELS: Record<string, string> = { amazon: "أمازون", noon: "نون" };

/**
 * تُستدعى بعد تسجيل حدث فشل. تحسب عدد الإخفاقات المتتالية منذ آخر نجاح،
 * وترسل تنبيهًا لكل الفريق الإداري مرة واحدة فقط لكل سلسلة إخفاقات.
 */
export async function maybeAlertSyncFailure(entry: {
  source: string;
  code?: string;
  message?: string;
  keyword?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // آخر نجاح لهذا المصدر
    const { data: lastSuccess } = await supabaseAdmin
      .from("sync_events")
      .select("created_at")
      .eq("source", entry.source)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const since = lastSuccess?.created_at ?? new Date(0).toISOString();

    // عدد الإخفاقات منذ آخر نجاح
    let failQuery = supabaseAdmin
      .from("sync_events")
      .select("id", { count: "exact", head: true })
      .eq("source", entry.source)
      .eq("status", "failure");
    if (lastSuccess?.created_at) failQuery = failQuery.gt("created_at", since);
    const { count } = await failQuery;
    const failures = count ?? 0;
    if (failures < MAX_SYNC_ATTEMPTS) return { alerted: false as const, failures };

    // منع التكرار: تنبيه واحد فقط لكل سلسلة إخفاقات
    let alertQuery = supabaseAdmin
      .from("admin_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "sync_failure_alert")
      .eq("target_id", entry.source);
    if (lastSuccess?.created_at) alertQuery = alertQuery.gt("created_at", since);
    const { count: alerted } = await alertQuery;
    if ((alerted ?? 0) > 0) return { alerted: false as const, failures };

    const sourceLabel = SOURCE_LABELS[entry.source] ?? entry.source;
    const reason = CODE_LABELS[entry.code ?? ""] ?? entry.code ?? "سبب غير معروف";
    const title = `فشل نهائي في مزامنة ${sourceLabel}`;
    const body = `نفدت محاولات إعادة المحاولة (${failures}/${MAX_SYNC_ATTEMPTS}). السبب: ${reason}${
      entry.message ? ` — ${entry.message.slice(0, 160)}` : ""
    }${entry.keyword ? ` • الكلمة: ${entry.keyword}` : ""}`;

    const { data: staffRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["super_admin", "admin", "support", "content_manager"]);
    const recipients = [...new Set((staffRows ?? []).map((r) => r.user_id as string))];

    if (recipients.length) {
      await supabaseAdmin.from("notifications").insert(
        recipients.map((uid) => ({
          user_id: uid,
          title,
          body,
          link: "/sync-log",
          is_broadcast: false,
        })),
      );
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: null,
      action: "sync_failure_alert",
      target_table: "sync_events",
      target_id: entry.source,
      meta: {
        failures: String(failures),
        code: entry.code ?? "unknown",
        message: entry.message?.slice(0, 300) ?? "",
        notified: String(recipients.length),
      },
    });

    return { alerted: true as const, failures, notified: recipients.length };
  } catch (error) {
    console.error("maybeAlertSyncFailure failed", error);
    return { alerted: false as const, failures: 0 };
  }
}
