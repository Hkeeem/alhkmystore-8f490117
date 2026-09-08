import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const clean = (v: unknown, max = 160) => String(v ?? "").trim().slice(0, max);

/** تسجيل نقرة/زيارة على عرض (عام) — يُستخدم في الخريطة وقائمة العروض */
export const recordDealClick = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const surface = clean(d.surface, 24) || "list";
    return {
      dealId: clean(d.dealId, 64),
      title: clean(d.title, 160),
      storeName: clean(d.storeName, 80),
      surface: ["list", "map", "detail", "coupon"].includes(surface) ? surface : "list",
      kind: clean(d.kind, 16) || "click",
      session: clean(d.session, 64),
      path: clean(d.path, 200),
    };
  })
  .handler(async ({ data }) => {
    if (!data.dealId) return { ok: false };
    const city = clean(getRequestHeader("cf-ipcity") ?? "", 80);
    const country = clean(getRequestHeader("cf-ipcountry") ?? "", 8);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analytics_events").insert({
      event: "deal_click",
      path: data.path || null,
      payload: {
        dealId: data.dealId,
        title: data.title,
        storeName: data.storeName,
        surface: data.surface,
        kind: data.kind,
        session: data.session,
        city: city || null,
        country: country || null,
      },
    });
    return { ok: true };
  });

export type DealClickStats = {
  totalClicks: number;
  uniqueDeals: number;
  sessions: number;
  bySurface: { surface: string; count: number }[];
  conversions: number;
  conversionRate: number;
  deals: {
    dealId: string;
    title: string;
    storeName: string;
    clicks: number;
    mapClicks: number;
    listClicks: number;
    conversions: number;
    lastAt: string;
  }[];
};

/** إحصاءات نقرات العروض للوحة الإدارة */
export const getDealClickStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const n = Number((data as { days?: unknown } | null)?.days);
    return { days: Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7 };
  })
  .handler(async ({ data, context }): Promise<DealClickStats> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: rows }, { data: convRows }] = await Promise.all([
      supabaseAdmin
        .from("analytics_events")
        .select("payload, created_at")
        .eq("event", "deal_click")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabaseAdmin.from("affiliate_conversions").select("deal_id").gte("created_at", since),
    ]);

    const list = rows ?? [];
    const convByDeal = new Map<string, number>();
    for (const c of convRows ?? []) {
      if (!c.deal_id) continue;
      convByDeal.set(c.deal_id, (convByDeal.get(c.deal_id) ?? 0) + 1);
    }

    const surfaces = new Map<string, number>();
    const sessions = new Set<string>();
    const perDeal = new Map<
      string,
      { title: string; storeName: string; clicks: number; map: number; list: number; lastAt: string }
    >();

    for (const r of list) {
      const p = (r.payload ?? {}) as Record<string, string | null>;
      const id = p.dealId ?? "";
      if (!id) continue;
      const surface = p.surface ?? "list";
      surfaces.set(surface, (surfaces.get(surface) ?? 0) + 1);
      if (p.session) sessions.add(p.session);
      const cur = perDeal.get(id) ?? {
        title: p.title || "عرض",
        storeName: p.storeName || "—",
        clicks: 0,
        map: 0,
        list: 0,
        lastAt: r.created_at,
      };
      cur.clicks += 1;
      if (surface === "map") cur.map += 1;
      else cur.list += 1;
      if (r.created_at > cur.lastAt) cur.lastAt = r.created_at;
      perDeal.set(id, cur);
    }

    const conversions = [...perDeal.keys()].reduce((s, id) => s + (convByDeal.get(id) ?? 0), 0);

    return {
      totalClicks: list.length,
      uniqueDeals: perDeal.size,
      sessions: sessions.size,
      bySurface: [...surfaces.entries()]
        .map(([surface, count]) => ({ surface, count }))
        .sort((a, b) => b.count - a.count),
      conversions,
      conversionRate: list.length ? Math.round((conversions / list.length) * 1000) / 10 : 0,
      deals: [...perDeal.entries()]
        .map(([dealId, v]) => ({
          dealId,
          title: v.title,
          storeName: v.storeName,
          clicks: v.clicks,
          mapClicks: v.map,
          listClicks: v.list,
          conversions: convByDeal.get(dealId) ?? 0,
          lastAt: v.lastAt,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 50),
    };
  });
