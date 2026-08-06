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

    await saveIntegrationKey(data.name, data.value, context.userId);
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

    await deleteIntegrationKey(data.name);
    return { ok: true as const };
  });
