import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedSupabase } from "../integrations/supabase/client";

// جداول المعرض (gallery_deals) خارج الأنواع المولّدة، لذا نستخدم عميلاً غير مقيّد بالأنواع.
const supabase = typedSupabase as unknown as SupabaseClient;

export type Deal = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  clicks_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DealInput = {
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  clicks_count?: number;
  is_active?: boolean;
  sort_order?: number;
};

export type DealView = {
  id: string;
  deal_id: string | null;
  view_type: "view" | "click";
  user_id: string | null;
  page_path: string | null;
  referrer: string | null;
  viewed_at: string;
};

export async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from("gallery_deals")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Deal[];
}

export async function createDeal(input: DealInput): Promise<Deal> {
  const { data, error } = await supabase
    .from("gallery_deals")
    .insert({ ...input, clicks_count: input.clicks_count ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data as Deal;
}

export async function updateDeal(id: string, input: Partial<DealInput>): Promise<Deal> {
  const { data, error } = await supabase
    .from("gallery_deals")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Deal;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase.from("gallery_deals").delete().eq("id", id);
  if (error) throw error;
}

export async function logDealView(
  dealId: string,
  opts: { viewType?: "view" | "click"; pagePath?: string; referrer?: string } = {},
): Promise<void> {
  const { error } = await supabase.rpc("log_deal_view", {
    p_deal_id: dealId,
    p_view_type: opts.viewType ?? "view",
    p_page_path: opts.pagePath ?? (typeof window !== "undefined" ? window.location.pathname : null),
    p_referrer: opts.referrer ?? (typeof document !== "undefined" ? document.referrer : null),
    p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
  if (error) console.error("logDealView:", error.message);
}

export async function fetchDealViews(limit = 200): Promise<DealView[]> {
  const { data, error } = await supabase
    .from("gallery_deal_views")
    .select("*")
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DealView[];
}

export async function fetchDealStats() {
  const { count: totalDeals } = await supabase
    .from("gallery_deals")
    .select("id", { count: "exact", head: true });

  const { data: clicks } = await supabase.from("gallery_deals").select("clicks_count");

  const totalClicks = (clicks ?? []).reduce((sum, d) => sum + (d.clicks_count ?? 0), 0);

  const { count: totalViews } = await supabase
    .from("gallery_deal_views")
    .select("id", { count: "exact", head: true });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { count: todayViews } = await supabase
    .from("gallery_deal_views")
    .select("id", { count: "exact", head: true })
    .gte("viewed_at", startOfToday.toISOString());

  return {
    totalDeals: totalDeals ?? 0,
    totalClicks,
    totalViews: totalViews ?? 0,
    todayViews: todayViews ?? 0,
  };
}
