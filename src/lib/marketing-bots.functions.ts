import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MARKETING_PLATFORMS = [
  "store",
  "twitter",
  "instagram",
  "tiktok",
  "snapchat",
] as const;
export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number];

export type MarketingBotKey = "store_marketing" | "twitter" | "instagram" | "tiktok" | "snapchat";

export type MarketingBotRow = {
  key: string;
  label: string;
  platform: string;
  enabled: boolean;
  offset_minutes: number;
  last_run_at: string | null;
  last_status: string | null;
  posts_count: number;
};

type RpcClient = { rpc: (fn: never, args: never) => unknown };

async function assertStaff(supabase: unknown, userId: string) {
  const client = supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  const { data: isStaff } = await client.rpc("is_staff", { _user_id: userId });
  if (!isStaff) throw new Error("forbidden");
}
void (0 as unknown as RpcClient);

export const getMarketingBots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("marketing_bots")
      .select("key, label, platform, enabled, offset_minutes, last_run_at, last_status, posts_count")
      .order("offset_minutes", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketingBotRow[];
  });

export const toggleMarketingBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    key: String((data as { key?: unknown })?.key ?? "") as MarketingBotKey,
    enabled: Boolean((data as { enabled?: unknown })?.enabled),
  }))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("marketing_bots")
      .update({ enabled: data.enabled })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runMarketingBotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({
    key: String((data as { key?: unknown })?.key ?? "") as MarketingBotKey,
  }))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const platform: MarketingPlatform = data.key === "store_marketing" ? "store" : data.key;
    if (!(MARKETING_PLATFORMS as readonly string[]).includes(platform)) {
      return { ok: false, message: "منصة غير معروفة", status: "failed" as const };
    }
    const { runMarketingBot } = await import("@/lib/marketing-bot.server");
    return runMarketingBot(platform);
  });
