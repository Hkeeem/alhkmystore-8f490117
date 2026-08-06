import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Filters = { days: number; country: string; referrer: string };

function parseFilters(data: unknown): Filters {
  const d = (data ?? {}) as Partial<Record<keyof Filters, unknown>>;
  const days = Number(d.days);
  return {
    days: Number.isFinite(days) && days > 0 ? Math.min(365, Math.floor(days)) : 30,
    country: typeof d.country === "string" ? d.country.slice(0, 16) : "",
    referrer: typeof d.referrer === "string" ? d.referrer.slice(0, 200) : "",
  };
}

export type ClickAnalytics = {
  totalClicks: number;
  uniqueDeals: number;
  topCountry: string | null;
  lastClickAt: string | null;
  byCountry: Array<{ key: string; clicks: number }>;
  byReferrer: Array<{ key: string; clicks: number }>;
  byNetwork: Array<{ key: string; clicks: number }>;
  byDay: Array<{ day: string; clicks: number }>;
  deals: Array<{
    dealId: string;
    title: string;
    clicks: number;
    lastClickAt: string | null;
    totalClicksAllTime: number;
    conversions: number;
    commission: number;
  }>;
  countryOptions: Array<string>;
  referrerOptions: Array<string>;
};

const host = (value: string | null) => {
  if (!value) return "مباشر";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.slice(0, 60);
  }
};

const tally = (items: Array<string>) => {
  const map = new Map<string, number>();
  for (const i of items) map.set(i, (map.get(i) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, clicks]) => ({ key, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
};

export const getClickAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseFilters)
  .handler(async ({ context, data }): Promise<ClickAnalytics> => {
    // الوصول للتحليلات مقصور على الأدوار الإدارية فقط (admin / super_admin)
    const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    ]);
    if (!isAdmin && !isSuperAdmin) throw new Error("forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabaseAdmin
      .from("affiliate_clicks")
      .select("deal_id, network, source, referrer, country, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.country) query = query.eq("country", data.country);
    if (data.referrer) query = query.ilike("referrer", `%${data.referrer}%`);

    const [{ data: clicks }, { data: statsRows }, { data: optionRows }] = await Promise.all([
      query,
      supabaseAdmin.from("affiliate_click_stats").select("deal_id, clicks, last_click_at"),
      supabaseAdmin.from("affiliate_clicks").select("country, referrer").limit(3000),
    ]);

    const rows = clicks ?? [];
    const dealIds = [...new Set(rows.map((r) => r.deal_id).filter(Boolean))] as Array<string>;

    const [{ data: dealRows }, { data: convRows }] = await Promise.all([
      dealIds.length
        ? supabaseAdmin.from("merchant_deals").select("id, title").in("id", dealIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
      supabaseAdmin
        .from("affiliate_conversions")
        .select("deal_id, commission, status")
        .gte("created_at", since),
    ]);

    const titles = new Map((dealRows ?? []).map((d) => [d.id, d.title]));
    const allTime = new Map((statsRows ?? []).map((s) => [s.deal_id as string, s]));

    const perDeal = new Map<string, { clicks: number; last: string | null }>();
    for (const r of rows) {
      const cur = perDeal.get(r.deal_id) ?? { clicks: 0, last: null };
      cur.clicks += 1;
      if (!cur.last || r.created_at > cur.last) cur.last = r.created_at;
      perDeal.set(r.deal_id, cur);
    }

    const convByDeal = new Map<string, { count: number; commission: number }>();
    for (const c of convRows ?? []) {
      if (!c.deal_id) continue;
      const cur = convByDeal.get(c.deal_id) ?? { count: 0, commission: 0 };
      cur.count += 1;
      cur.commission += Number(c.commission ?? 0);
      convByDeal.set(c.deal_id, cur);
    }

    const byCountry = tally(rows.map((r) => r.country || "غير معروف"));
    const byReferrer = tally(rows.map((r) => host(r.referrer)));
    const byNetwork = tally(rows.map((r) => r.network || r.source || "غير محدد"));
    const byDay = tally(rows.map((r) => String(r.created_at).slice(0, 10)))
      .map(({ key, clicks }) => ({ day: key, clicks }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return {
      totalClicks: rows.length,
      uniqueDeals: perDeal.size,
      topCountry: byCountry[0]?.key ?? null,
      lastClickAt: rows[0]?.created_at ?? null,
      byCountry: byCountry.slice(0, 10),
      byReferrer: byReferrer.slice(0, 10),
      byNetwork: byNetwork.slice(0, 10),
      byDay,
      deals: [...perDeal.entries()]
        .map(([dealId, v]) => ({
          dealId,
          title: titles.get(dealId) ?? "عرض محذوف",
          clicks: v.clicks,
          lastClickAt: v.last,
          totalClicksAllTime: Number(allTime.get(dealId)?.clicks ?? v.clicks),
          conversions: convByDeal.get(dealId)?.count ?? 0,
          commission: convByDeal.get(dealId)?.commission ?? 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 100),
      countryOptions: [...new Set((optionRows ?? []).map((r) => r.country).filter(Boolean) as Array<string>)].sort(),
      referrerOptions: [...new Set((optionRows ?? []).map((r) => host(r.referrer)))].filter((r) => r !== "مباشر").slice(0, 20).sort(),
    };
  });
