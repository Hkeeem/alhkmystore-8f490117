import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** حالة المفاتيح فقط — لا تُعاد أي قيمة مهما كان دور المستخدم. */
export const getIntegrationKeysStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getIntegrationKeyPresence } = await import("@/lib/integration-keys.server");
  return getIntegrationKeyPresence();
});

export const saveIntegrationKeyValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { name?: unknown; value?: unknown };
    return {
      name: String(d?.name ?? "").trim(),
      value: String(d?.value ?? "").trim().slice(0, 512),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const { isIntegrationKeyName, saveIntegrationKey } = await import("@/lib/integration-keys.server");
    if (!isIntegrationKeyName(data.name)) return { ok: false as const, reason: "مفتاح غير معروف." };
    if (data.value.length < 3) return { ok: false as const, reason: "القيمة قصيرة جدًا." };

    const previous = data.name === "NOON_AFFILIATE_ID"
      ? ((await (await import("@/lib/integration-keys.server")).getIntegrationKey("NOON_AFFILIATE_ID")) ?? "")
      : "";

    await saveIntegrationKey(data.name, data.value, context.userId);

    if (data.name === "NOON_AFFILIATE_ID") {
      const { maskSecretValue } = await import("@/lib/noon-audit.functions");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("admin_audit_log").insert({
        actor_id: context.userId,
        action: "noon_publisher_saved",
        target_table: "integration_credentials",
        target_id: "NOON_AFFILIATE_ID",
        meta: {
          publisherId: maskSecretValue(data.value),
          ...(previous ? { previousPublisherId: maskSecretValue(previous) } : {}),
          result: previous ? "تحديث معرّف موجود" : "حفظ معرّف جديد",
          source: "لوحة الإعدادات",
        },
      });
    }
    return { ok: true as const };
  });

export const removeIntegrationKeyValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({ name: String((data as { name?: unknown })?.name ?? "").trim() }))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const { isIntegrationKeyName, deleteIntegrationKey } = await import("@/lib/integration-keys.server");
    if (!isIntegrationKeyName(data.name)) return { ok: false as const, reason: "مفتاح غير معروف." };

    const previous = data.name === "NOON_AFFILIATE_ID"
      ? ((await (await import("@/lib/integration-keys.server")).getIntegrationKey("NOON_AFFILIATE_ID")) ?? "")
      : "";

    await deleteIntegrationKey(data.name);

    if (data.name === "NOON_AFFILIATE_ID") {
      const { maskSecretValue } = await import("@/lib/noon-audit.functions");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("admin_audit_log").insert({
        actor_id: context.userId,
        action: "noon_publisher_removed",
        target_table: "integration_credentials",
        target_id: "NOON_AFFILIATE_ID",
        meta: {
          ...(previous ? { previousPublisherId: maskSecretValue(previous) } : {}),
          result: "تم حذف المعرّف وفك الربط",
          source: "لوحة الإعدادات",
        },
      });
    }
    return { ok: true as const };
  });

/** اختبار اتصال حقيقي بمفاتيح Amazon PA-API — للمشرفين فقط، ولا يعيد أي قيمة سرية. */
export const testAmazonConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { testAmazonCredentials } = await import("@/lib/external-sync.server");
    const result = await testAmazonCredentials();
    return { ...result, testedAt: new Date().toISOString() };
  });
