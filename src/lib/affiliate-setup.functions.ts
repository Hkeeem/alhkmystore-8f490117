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
