import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAffiliateKeyStatus = createServerFn({ method: "GET" }).handler(async () => {
  const has = (name: string) => Boolean(process.env[name] && String(process.env[name]).trim().length > 0);
  return {
    amazonAccessKey: has("AMAZON_ACCESS_KEY"),
    amazonSecretKey: has("AMAZON_SECRET_KEY"),
    amazonPartnerTag: has("AMAZON_PARTNER_TAG"),
    noonAffiliateId: has("NOON_AFFILIATE_ID"),
  };
});

export const getSyncOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sources = ["amazon", "noon"] as const;
  const out: Record<string, { active: number; lastFetchedAt: string | null }> = {};
  for (const source of sources) {
    const { count } = await supabaseAdmin
      .from("external_deals")
      .select("id", { count: "exact", head: true })
      .eq("source", source)
      .eq("active", true);
    const { data } = await supabaseAdmin
      .from("external_deals")
      .select("fetched_at")
      .eq("source", source)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    out[source] = { active: count ?? 0, lastFetchedAt: data?.fetched_at ?? null };
  }
  return out as { amazon: { active: number; lastFetchedAt: string | null }; noon: { active: number; lastFetchedAt: string | null } };
});

export const runExternalSyncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    try {
      const { syncExternalDeals } = await import("@/lib/external-sync.server");
      const result = await syncExternalDeals();
      return { success: true as const, ...result };
    } catch (error) {
      console.error("manual external sync failed", error);
      return { success: false as const, error: "sync_failed" };
    }
  });

export const getConversionsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from("affiliate_conversions")
      .select("network, status, amount, commission, created_at")
      .gte("created_at", since);
    const rows = data ?? [];
    const summarize = (network: string) => {
      const items = rows.filter((r) => r.network === network);
      return {
        count: items.length,
        approved: items.filter((r) => r.status === "approved").length,
        sales: items.reduce((s, r) => s + Number(r.amount ?? 0), 0),
        commission: items.reduce((s, r) => s + Number(r.commission ?? 0), 0),
        lastAt: items.map((r) => r.created_at).sort().at(-1) ?? null,
      };
    };
    return { amazon: summarize("amazon"), noon: summarize("noon"), other: summarize("other") };
  });

export const getPostbackStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: Boolean(process.env["AFFILIATE_POSTBACK_SECRET"]),
}));
