import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MarketingBotKey = "store_marketing" | "twitter" | "instagram" | "tiktok" | "snapchat";

const KEYS: MarketingBotKey[] = ["store_marketing", "twitter", "instagram", "tiktok", "snapchat"];

export type MarketingBotRow = {
  key: MarketingBotKey;
  label: string;
  platform: string;
  enabled: boolean;
  offset_minutes: number;
  last_run_at: string | null;
  last_status: string | null;
  posts_count: number;
};

export type MarketingPostRow = {
  id: string;
  platform: string;
  title: string | null;
  content: string;
  link_url: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

export const getMarketingBots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const db = context.supabase as any;
    const [bots, posts] = await Promise.all([
      db.from("marketing_bots").select("*").order("offset_minutes"),
      db
        .from("marketing_posts")
        .select("id, platform, title, content, link_url, status, error, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (bots.error) throw new Error(bots.error.message);
    return {
      bots: (bots.data ?? []) as MarketingBotRow[],
      posts: (posts.data ?? []) as MarketingPostRow[],
    };
  });

export const toggleMarketingBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: MarketingBotKey; enabled: boolean }) => {
    if (!KEYS.includes(input?.key)) throw new Error("بوت غير معروف");
    return { key: input.key, enabled: Boolean(input.enabled) };
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await (context.supabase as any)
      .from("marketing_bots")
      .update({ enabled: data.enabled })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runMarketingBotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: MarketingBotKey }) => {
    if (!KEYS.includes(input?.key)) throw new Error("بوت غير معروف");
    return { key: input.key };
  })
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { runMarketingBot } = await import("@/lib/marketing-bot.server");
    const platform = data.key === "store_marketing" ? "store" : data.key;
    const result = await runMarketingBot(platform as never);
    return { ok: result.ok, message: result.message };
  });
