import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

function platformFromKey(key: string): string {
  return key === "store_marketing" ? "store" : key;
}

export const getMarketingBots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

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
  .inputValidator((data: unknown) => {
    const d = data as { key?: unknown; enabled?: unknown };
    return { key: String(d?.key ?? ""), enabled: Boolean(d?.enabled) };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("marketing_bots")
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const runMarketingBotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({ key: String((data as { key?: unknown })?.key ?? "") }))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");

    const { runMarketingBot, isMarketingPlatform } = await import("@/lib/marketing-bot.server");
    const platform = platformFromKey(data.key);
    if (!isMarketingPlatform(platform)) throw new Error("unknown_bot");
    return runMarketingBot(platform);
  });
