import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BotKey = "shareeti" | "real_estate" | "deals_radar" | "coupon_hunter";

export type BotStatus = {
  key: BotKey;
  label: string;
  jobname: string;
  schedule: string | null;
  active: boolean;
  exists: boolean;
  lastStatus: string | null;
  lastRunAt: string | null;
  count: number;
};

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

export const getBotsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { data, error } = await (context.supabase as any).rpc("get_bots_status");
    if (error) throw new Error(error.message);
    return (data ?? []) as BotStatus[];
  });

export const runBotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: BotKey }) => {
    const allowed: BotKey[] = ["shareeti", "real_estate", "deals_radar", "coupon_hunter"];
    if (!allowed.includes(input?.key)) throw new Error("بوت غير معروف");
    return { key: input.key };
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    try {
      if (data.key === "shareeti") {
        const { runStoreBot } = await import("@/lib/store-bot.server");
        const r = await runStoreBot();
        return { ok: true, message: `جُلب ${r.upserted ?? 0} عرضًا` };
      }
      if (data.key === "real_estate") {
        const { syncHarajListings } = await import("@/lib/haraj.server");
        const r: any = await syncHarajListings();
        return { ok: true, message: `حُدِّث ${r?.upserted ?? r?.count ?? 0} إعلانًا عقاريًا` };
      }
      const { syncExternalDeals } = await import("@/lib/external-sync.server");
      const r: any = await syncExternalDeals();
      return {
        ok: true,
        message:
          data.key === "coupon_hunter"
            ? `حُدِّثت الكوبونات (${r?.coupons ?? r?.upserted ?? 0})`
            : `حُدِّث ${r?.upserted ?? 0} عرضًا`,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "تعذّر تشغيل البوت");
    }
  });
