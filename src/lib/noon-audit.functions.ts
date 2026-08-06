import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * سجل تدقيق لعمليات ربط/فك حملة noon وتغيير Publisher ID.
 * يُكتب في admin_audit_log بأفعال تبدأ بـ noon_ ولا يحتوي أي قيمة سرية كاملة.
 */

export const NOON_AUDIT_ACTIONS = {
  noon_link_campaign: "ربط حملة noon",
  noon_unlink_campaign: "فك ربط حملة noon",
  noon_verify_publisher: "تأكيد Publisher ID",
  noon_publisher_saved: "حفظ/تحديث Publisher ID",
  noon_publisher_removed: "حذف Publisher ID",
} as const;

export type NoonAuditAction = keyof typeof NOON_AUDIT_ACTIONS;

export function maskSecretValue(value: string): string {
  const v = value.trim();
  if (!v) return "—";
  if (v.length <= 5) return `${v.slice(0, 1)}${"•".repeat(Math.max(2, v.length - 1))}`;
  return `${v.slice(0, 3)}${"•".repeat(Math.max(2, v.length - 5))}${v.slice(-2)}`;
}

const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export type NoonAuditEntry = {
  id: string;
  action: NoonAuditAction;
  actionLabel: string;
  actorName: string;
  at: string;
  details: Array<{ label: string; value: string }>;
};

const DETAIL_LABELS: Record<string, string> = {
  campaignId: "الحملة (المعرّف)",
  campaignName: "اسم الحملة",
  previousCampaignId: "الحملة السابقة",
  network: "الشبكة",
  publisherId: "Publisher ID (مقنّع)",
  previousPublisherId: "Publisher ID السابق (مقنّع)",
  result: "النتيجة",
  source: "المصدر",
};

/** تسجيل حدث ربط/فك ربط أو تأكيد معرّف — للمشرفين فقط. */
export const logNoonCampaignEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const action = str(d["action"], 40) as NoonAuditAction;
    if (!(action in NOON_AUDIT_ACTIONS)) throw new Error("حدث غير معروف");
    return {
      action,
      campaignId: str(d["campaignId"], 60),
      campaignName: str(d["campaignName"], 120),
      previousCampaignId: str(d["previousCampaignId"], 60),
      network: str(d["network"], 40),
      publisherId: str(d["publisherId"], 120),
      result: str(d["result"], 200),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const meta: Record<string, string> = {};
    if (data.campaignId) meta["campaignId"] = data.campaignId;
    if (data.campaignName) meta["campaignName"] = data.campaignName;
    if (data.previousCampaignId) meta["previousCampaignId"] = data.previousCampaignId;
    if (data.network) meta["network"] = data.network;
    if (data.publisherId) meta["publisherId"] = maskSecretValue(data.publisherId);
    if (data.result) meta["result"] = data.result;
    meta["source"] = "لوحة الإعدادات";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: data.action,
      target_table: "integration_credentials",
      target_id: "NOON_AFFILIATE_ID",
      meta,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** قراءة سجل تدقيق noon — للمشرفين فقط. */
export const listNoonAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    limit: Math.min(100, Math.max(5, Number((data as { limit?: unknown })?.limit) || 25)),
  }))
  .handler(async ({ data, context }): Promise<Array<NoonAuditEntry>> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id, actor_id, action, meta, created_at")
      .like("action", "noon\\_%")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const actorIds = [...new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean))] as Array<string>;
    const names = new Map<string, string>();
    if (actorIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", actorIds);
      for (const p of profiles ?? []) names.set(p.id as string, (p.display_name as string) || "مشرف");
    }

    return (rows ?? []).map((r) => {
      const meta = (r.meta ?? {}) as Record<string, unknown>;
      const details = Object.entries(meta)
        .filter(([, v]) => typeof v === "string" && v)
        .map(([k, v]) => ({ label: DETAIL_LABELS[k] ?? k, value: String(v) }));
      const action = r.action as NoonAuditAction;
      return {
        id: r.id as string,
        action,
        actionLabel: NOON_AUDIT_ACTIONS[action] ?? action,
        actorName: (r.actor_id && names.get(r.actor_id as string)) || "غير معروف",
        at: r.created_at as string,
        details,
      };
    });
  });
