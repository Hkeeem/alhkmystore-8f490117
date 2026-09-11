import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const clean = (v: unknown, max = 160) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

const SURFACES = ["list", "map", "detail", "coupon", "coupon-detail", "home"];
const EVENT_TYPES = [
  "click",
  "coupon_copy",
  "store_click",
  "detail_view",
  "share",
  "favorite",
] as const;

/** تسجيل نقرة عرض أو كوبون في جدول offer_clicks (عام، بدون بيانات شخصية) */
export const recordOfferClick = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const surface = clean(d.surface, 24) || "list";
    const kind = clean(d.kind, 16) || "offer";
    const eventType = clean(d.eventType, 24) || "click";
    return {
      kind: ["offer", "coupon"].includes(kind) ? kind : "offer",
      eventType: (EVENT_TYPES as readonly string[]).includes(eventType) ? eventType : "click",
      offerId: clean(d.offerId, 80),
      offerTitle: clean(d.offerTitle, 200),
      storeId: clean(d.storeId, 80),
      storeName: clean(d.storeName, 120),
      couponCode: clean(d.couponCode, 40),
      surface: SURFACES.includes(surface) ? surface : "list",
      path: clean(d.path, 200),
      session: clean(d.session, 64),
    };
  })
  .handler(async ({ data }) => {
    if (!data.offerId) return { ok: false };
    const city = clean(getRequestHeader("cf-ipcity") ?? "", 80);
    const country = clean(getRequestHeader("cf-ipcountry") ?? "", 8);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("offer_clicks").insert({
      kind: data.kind,
      event_type: data.eventType,
      occurred_at: new Date().toISOString(),
      offer_id: data.offerId,
      offer_title: data.offerTitle || null,
      store_id: data.storeId || null,
      store_name: data.storeName || null,
      coupon_code: data.couponCode || null,
      surface: data.surface,
      path: data.path || null,
      session: data.session || null,
      city: city || null,
      country: country || null,
    });
    return { ok: true };
  });


/** بلاغ «الكوبون لا يعمل» من الواجهة العامة */
export const reportCouponIssue = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const reason = clean(d.reason, 32) || "not_working";
    return {
      couponId: clean(d.couponId, 80),
      couponCode: clean(d.couponCode, 40),
      storeId: clean(d.storeId, 80),
      storeName: clean(d.storeName, 120),
      siteUrl: clean(d.siteUrl, 500),
      offerUrl: clean(d.offerUrl, 500),
      reason: ["not_working", "expired", "wrong_price", "other"].includes(reason)
        ? reason
        : "other",
      note: clean(d.note, 400),
      session: clean(d.session, 64),
    };
  })
  .handler(async ({ data }) => {
    if (!data.couponId) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupon_reports").insert({
      coupon_id: data.couponId,
      coupon_code: data.couponCode || null,
      store_id: data.storeId || null,
      store_name: data.storeName || null,
      site_url: data.siteUrl || null,
      offer_url: data.offerUrl || null,
      reason: data.reason,
      note: data.note || null,
      session: data.session || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type OfferClickRow = {
  id: string;
  kind: string;
  offerId: string;
  offerTitle: string;
  storeName: string;
  couponCode: string | null;
  surface: string;
  city: string | null;
  path: string | null;
  createdAt: string;
};

export type OfferClickSummary = {
  total: number;
  offers: number;
  coupons: number;
  sessions: number;
  topOffers: { offerId: string; title: string; storeName: string; clicks: number; kind: string }[];
  bySurface: { surface: string; count: number }[];
  byCity: { city: string; count: number }[];
  recent: OfferClickRow[];
};

/** ملخّص نقرات العروض والكوبونات للوحة /admin */
export const adminOfferClickSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const n = Number((data as { days?: unknown } | null)?.days);
    return { days: Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7 };
  })
  .handler(async ({ data, context }): Promise<OfferClickSummary> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("offer_clicks")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3000);
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const sessions = new Set<string>();
    const surfaces = new Map<string, number>();
    const cities = new Map<string, number>();
    const perOffer = new Map<
      string,
      { title: string; storeName: string; clicks: number; kind: string }
    >();

    for (const r of list) {
      if (r.session) sessions.add(r.session);
      surfaces.set(r.surface, (surfaces.get(r.surface) ?? 0) + 1);
      const city = r.city || "غير محدد";
      cities.set(city, (cities.get(city) ?? 0) + 1);
      const cur = perOffer.get(r.offer_id) ?? {
        title: r.offer_title || "عرض",
        storeName: r.store_name || "—",
        clicks: 0,
        kind: r.kind,
      };
      cur.clicks += 1;
      perOffer.set(r.offer_id, cur);
    }

    const sort = <T>(m: Map<string, number>, f: (k: string, v: number) => T) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => f(k, v));

    return {
      total: list.length,
      offers: list.filter((r) => r.kind === "offer").length,
      coupons: list.filter((r) => r.kind === "coupon").length,
      sessions: sessions.size,
      topOffers: [...perOffer.entries()]
        .map(([offerId, v]) => ({ offerId, ...v }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 30),
      bySurface: sort(surfaces, (surface, count) => ({ surface, count })),
      byCity: sort(cities, (city, count) => ({ city, count })),
      recent: list.slice(0, 50).map((r) => ({
        id: r.id,
        kind: r.kind,
        offerId: r.offer_id,
        offerTitle: r.offer_title ?? "عرض",
        storeName: r.store_name ?? "—",
        couponCode: r.coupon_code,
        surface: r.surface,
        city: r.city,
        path: r.path,
        createdAt: r.created_at,
      })),
    };
  });

export type CouponReportRow = {
  id: string;
  couponId: string;
  couponCode: string | null;
  storeName: string | null;
  siteUrl: string | null;
  offerUrl: string | null;
  reason: string;
  note: string | null;
  status: string;
  createdAt: string;
};

/** قائمة بلاغات الكوبونات غير العاملة (شاشة المراقبة) */
export const adminListCouponReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const s = String((data as { status?: unknown } | null)?.status ?? "open");
    return { status: ["open", "fixed", "dismissed", "all"].includes(s) ? s : "open" };
  })
  .handler(async ({ data, context }): Promise<CouponReportRow[]> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    let q = context.supabase
      .from("coupon_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r) => ({
      id: r.id,
      couponId: r.coupon_id,
      couponCode: r.coupon_code,
      storeName: r.store_name,
      siteUrl: r.site_url,
      offerUrl: r.offer_url,
      reason: r.reason,
      note: r.note,
      status: r.status,
      createdAt: r.created_at,
    }));
  });

/** تحديث حالة بلاغ كوبون */
export const adminUpdateCouponReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const status = clean(d.status, 16);
    return {
      id: clean(d.id, 64),
      status: ["open", "fixed", "dismissed"].includes(status) ? status : "open",
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("coupon_reports")
      .update({
        status: data.status,
        resolved_by: data.status === "open" ? null : context.userId,
        resolved_at: data.status === "open" ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ClickBreakdown = {
  total: number;
  sessions: number;
  byStore: { storeId: string; storeName: string; clicks: number }[];
  byEvent: { eventType: string; count: number }[];
  byDay: { day: string; count: number }[];
  storeOptions: { storeId: string; storeName: string }[];
  recent: {
    id: string;
    eventType: string;
    offerTitle: string;
    storeName: string;
    surface: string;
    occurredAt: string;
  }[];
};

/** تفصيل النقرات حسب المتجر ونوع الحدث والفترة الزمنية (شاشة الإدارة) */
export const adminClickBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const n = Number(d.days);
    const ev = clean(d.eventType, 24);
    return {
      days: Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 7,
      eventType: ["coupon_copy", "store_click", "detail_view", "share", "favorite", "click"].includes(ev)
        ? ev
        : "",
      storeId: clean(d.storeId, 80),
    };
  })
  .handler(async ({ data, context }): Promise<ClickBreakdown> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    let q = context.supabase
      .from("offer_clicks")
      .select("id, event_type, offer_title, store_id, store_name, surface, session, occurred_at")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(5000);
    if (data.eventType) q = q.eq("event_type", data.eventType);
    if (data.storeId) q = q.eq("store_id", data.storeId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const sessions = new Set<string>();
    const stores = new Map<string, { name: string; clicks: number }>();
    const events = new Map<string, number>();
    const days = new Map<string, number>();

    for (const r of list) {
      if (r.session) sessions.add(r.session);
      const sid = r.store_id || "unknown";
      const cur = stores.get(sid) ?? { name: r.store_name || "غير محدد", clicks: 0 };
      cur.clicks += 1;
      stores.set(sid, cur);
      const ev = r.event_type || "click";
      events.set(ev, (events.get(ev) ?? 0) + 1);
      const day = String(r.occurred_at).slice(0, 10);
      days.set(day, (days.get(day) ?? 0) + 1);
    }

    return {
      total: list.length,
      sessions: sessions.size,
      byStore: [...stores.entries()]
        .map(([storeId, v]) => ({ storeId, storeName: v.name, clicks: v.clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 40),
      byEvent: [...events.entries()]
        .map(([eventType, count]) => ({ eventType, count }))
        .sort((a, b) => b.count - a.count),
      byDay: [...days.entries()]
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      storeOptions: [...stores.entries()]
        .map(([storeId, v]) => ({ storeId, storeName: v.name }))
        .sort((a, b) => a.storeName.localeCompare(b.storeName)),
      recent: list.slice(0, 60).map((r) => ({
        id: r.id,
        eventType: r.event_type || "click",
        offerTitle: r.offer_title ?? "عرض",
        storeName: r.store_name ?? "—",
        surface: r.surface,
        occurredAt: r.occurred_at,
      })),
    };
  });
