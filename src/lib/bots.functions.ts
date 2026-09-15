import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BotStatus = {
  key: string;
  label: string;
  jobname: string;
  schedule: string | null;
  active: boolean;
  exists: boolean;
  lastStatus: string | null;
  lastRunAt: string | null;
  count: number;
};

export type BotKey = "shareeti" | "real_estate" | "deals_radar" | "coupon_hunter";

/** حالة البوتات الأربعة — لفريق العمل فقط (الدالة نفسها تتحقق من الصلاحية). */
export const getBotsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_bots_status" as never);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as BotStatus[];
  });

/** تشغيل بوت فورًا من لوحة التحكم. */
export const runBotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    key: String((data as { key?: unknown })?.key ?? "") as BotKey,
  }))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    switch (data.key) {
      case "shareeti": {
        const { runStoreBot } = await import("@/lib/store-bot.server");
        const r = await runStoreBot();
        return { ok: true, message: `اكتمل: ${JSON.stringify(r).slice(0, 120)}` };
      }
      case "real_estate": {
        const { runHarajSync } = await import("@/lib/haraj.server");
        const r = await runHarajSync();
        return { ok: true, message: `اكتمل: ${JSON.stringify(r).slice(0, 120)}` };
      }
      case "deals_radar":
      case "coupon_hunter": {
        const { syncExternalDeals } = await import("@/lib/external-sync.server");
        const r = await syncExternalDeals();
        return { ok: true, message: `اكتمل: ${JSON.stringify(r).slice(0, 120)}` };
      }
      default:
        return { ok: false, message: "بوت غير معروف" };
    }
  });
