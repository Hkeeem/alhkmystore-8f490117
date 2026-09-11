import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const clean = (v: unknown, max = 160) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

/** تسجيل زيارة صفحة (عام) — بدون بيانات شخصية، فقط المسار والمدينة التقريبية */
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { path?: unknown; session?: unknown; referrer?: unknown };
    return {
      path: clean(d.path, 200) || "/",
      session: clean(d.session, 64),
      referrer: clean(d.referrer, 200),
    };
  })
  .handler(async ({ data }) => {
    const city = clean(getRequestHeader("cf-ipcity") ?? "", 80);
    const country = clean(getRequestHeader("cf-ipcountry") ?? "", 8);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analytics_events").insert({
      event: "page_view",
      path: data.path,
      payload: {
        session: data.session,
        referrer: data.referrer,
        city: city || null,
        country: country || null,
      },
    });
    return { ok: true };
  });

export type VisitorStats = {
  total: number;
  sessions: number;
  byPath: { path: string; count: number }[];
  byCity: { city: string; count: number }[];
  journeys: { session: string; city: string | null; steps: { path: string; at: string }[] }[];
};

/** إحصاءات الزوار للوحة الإدارة (يتطلب صلاحية موظف/مشرف) */
export const getVisitorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { days?: unknown };
    const n = Number(d.days);
    return { days: Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7 };
  })
  .handler(async ({ data, context }): Promise<VisitorStats> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("analytics_events")
      .select("event,path,payload,created_at")
      .eq("event", "page_view")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3000);
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const pathCount = new Map<string, number>();
    const cityCount = new Map<string, number>();
    const bySession = new Map<
      string,
      { city: string | null; steps: { path: string; at: string }[] }
    >();

    for (const r of list) {
      const p = r.path ?? "/";
      pathCount.set(p, (pathCount.get(p) ?? 0) + 1);
      const payload = (r.payload ?? {}) as { session?: string; city?: string | null };
      const city = payload.city || "غير محدد";
      cityCount.set(city, (cityCount.get(city) ?? 0) + 1);
      const session = payload.session || "غير معروف";
      const entry = bySession.get(session) ?? { city: payload.city ?? null, steps: [] };
      entry.steps.push({ path: p, at: r.created_at });
      bySession.set(session, entry);
    }

    const sortDesc = <T>(m: Map<string, number>, key: (k: string, v: number) => T) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => key(k, v));

    return {
      total: list.length,
      sessions: bySession.size,
      byPath: sortDesc(pathCount, (path, count) => ({ path, count })).slice(0, 20),
      byCity: sortDesc(cityCount, (city, count) => ({ city, count })),
      journeys: [...bySession.entries()].slice(0, 30).map(([session, v]) => ({
        session,
        city: v.city,
        steps: v.steps.slice().reverse().slice(0, 12),
      })),
    };
  });
