import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAffiliateKeyStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getIntegrationKeyPresence } = await import("@/lib/integration-keys.server");
  const rows = await getIntegrationKeyPresence();
  const has = (name: string) => rows.find((r) => r.name === name)?.configured ?? false;
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
  .inputValidator((data: unknown) => {
    const raw = String((data as { source?: unknown })?.source ?? "all");
    const source = (["amazon", "noon", "all"].includes(raw) ? raw : "all") as "amazon" | "noon" | "all";
    return { source };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    try {
      const { syncExternalDeals, DEFAULT_KEYWORDS } = await import("@/lib/external-sync.server");
      const result = await syncExternalDeals(DEFAULT_KEYWORDS, data.source);
      return { success: true as const, source: data.source, ...result };
    } catch (error) {
      console.error("manual external sync failed", error);
      return { success: false as const, source: data.source, error: "sync_failed" };
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

/* ------------------------- noon campaign linking ------------------------- */

export type NoonCampaign = {
  id: string;
  name: string;
  network: string;
  market: string;
  model: string;
  deepLink: boolean;
  note: string;
  idHint: string;
  match: (publisherId: string) => boolean;
};

const NOON_CAMPAIGNS: Array<Omit<NoonCampaign, "match"> & { prefixes: Array<string> }> = [
  {
    id: "admitad-ksa",
    name: "noon KSA — Admitad",
    network: "Admitad",
    market: "السعودية",
    model: "CPS",
    deepLink: true,
    note: "الأنسب لتطبيقات مقارنة الأسعار: يدعم الروابط العميقة و subid لتتبّع النقرة.",
    idHint: "مثال: 2098765a1b… أو admitad_xxx",
    prefixes: ["admitad", "adm_"],
  },
  {
    id: "boostiny-ksa",
    name: "noon KSA — Boostiny / Arabyads",
    network: "Boostiny",
    market: "السعودية",
    model: "CPS + كوبونات",
    deepLink: true,
    note: "مناسب إذا كنت تعرض كوبونات نون داخل التطبيق.",
    idHint: "مثال: bst_hkeeem أو hkeeem-noon",
    prefixes: ["bst", "boostiny"],
  },
  {
    id: "noon-direct",
    name: "noon Affiliates — تسجيل مباشر",
    network: "noon",
    market: "السعودية",
    model: "CPS",
    deepLink: true,
    note: "أبسط خيار عند قبول التسجيل المباشر، وتُمرَّر الهوية عبر utm_source.",
    idHint: "مثال: hkeeem أو hkeeemai",
    prefixes: [],
  },
];

function pickNoonCampaign(publisherId: string) {
  const id = publisherId.trim().toLowerCase();
  const matched = NOON_CAMPAIGNS.find((c) => c.prefixes.some((p) => id.startsWith(p)));
  return matched ?? NOON_CAMPAIGNS[2]!;
}

export const getNoonCampaignStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getIntegrationKey } = await import("@/lib/integration-keys.server");
  const publisherId = ((await getIntegrationKey("NOON_AFFILIATE_ID")) ?? "").trim();
  const configured = publisherId.length > 0;

  const campaigns = NOON_CAMPAIGNS.map(({ prefixes: _p, ...c }) => c);
  const recommended = configured ? pickNoonCampaign(publisherId).id : "admitad-ksa";

  let liveDeals = 0;
  let clicks = 0;
  let conversions = 0;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [dealsRes, clicksRes, convRes] = await Promise.all([
      supabaseAdmin.from("external_deals").select("id", { count: "exact", head: true }).eq("source", "noon").eq("active", true),
      supabaseAdmin.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("network", "noon"),
      supabaseAdmin.from("affiliate_conversions").select("id", { count: "exact", head: true }).eq("network", "noon"),
    ]);
    liveDeals = dealsRes.count ?? 0;
    clicks = clicksRes.count ?? 0;
    conversions = convRes.count ?? 0;
  } catch { /* ignore */ }

  // مربوطة فعليًا = المعرّف محفوظ + عروض نون تُسحب + مرّت نقرة واحدة على الأقل عبر التحويل
  const linked = configured && liveDeals > 0 && clicks > 0;

  return {
    configured,
    linked,
    maskedPublisherId: configured
      ? `${publisherId.slice(0, 3)}${"•".repeat(Math.max(2, publisherId.length - 5))}${publisherId.slice(-2)}`
      : null,
    recommended,
    campaigns,
    stats: { liveDeals, clicks, conversions },
    sampleDeepLink: configured
      ? `https://www.noon.com/saudi-ar/p/?sku=EXAMPLE&utm_source=${encodeURIComponent(publisherId)}&utm_medium=affiliate&subid=<clickId>`
      : null,
  };
});

export const verifyNoonPublisherId = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ({
    publisherId: String((data as { publisherId?: unknown })?.publisherId ?? "").trim().slice(0, 120),
  }))
  .handler(async ({ data }) => {
    const input = data.publisherId;
    if (!input) return { ok: false as const, reason: "أدخل معرّف الناشر أولًا." };
    if (!/^[A-Za-z0-9._-]{3,64}$/.test(input)) {
      return { ok: false as const, reason: "الصيغة غير صحيحة: يُسمح بالحروف والأرقام والرموز . _ - بطول ٣ إلى ٦٤." };
    }
    const { getIntegrationKey } = await import("@/lib/integration-keys.server");
    const stored = ((await getIntegrationKey("NOON_AFFILIATE_ID")) ?? "").trim();
    const campaign = pickNoonCampaign(input);
    return {
      ok: true as const,
      matchesStored: stored.length > 0 ? stored === input : null,
      campaignId: campaign.id,
      campaignName: campaign.name,
      network: campaign.network,
    };
  });

/* --------------------- أسباب آخر فشل في تحديث المصادر --------------------- */

export type SyncFailureInfo = {
  source: "amazon" | "noon";
  code: string;
  message: string | null;
  keyword: string | null;
  at: string;
  recoveredAt: string | null;
};

export const getSyncFailures = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sources = ["amazon", "noon"] as const;
  const out: Record<string, SyncFailureInfo | null> = { amazon: null, noon: null };

  for (const source of sources) {
    const { data: failure } = await supabaseAdmin
      .from("sync_events")
      .select("source, code, message, keyword, created_at")
      .eq("source", source)
      .eq("status", "failure")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!failure) continue;

    const { data: success } = await supabaseAdmin
      .from("sync_events")
      .select("created_at")
      .eq("source", source)
      .eq("status", "success")
      .gt("created_at", failure.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    out[source] = {
      source,
      code: failure.code ?? "http_error",
      message: failure.message ?? null,
      keyword: failure.keyword ?? null,
      at: failure.created_at,
      recoveredAt: success?.created_at ?? null,
    };
  }

  return out as { amazon: SyncFailureInfo | null; noon: SyncFailureInfo | null };
});

/** قراءة إعدادات المزامنة المجدولة (فترة التشغيل + الحالة) — للمشرفين */
export const getSyncSchedule = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)("get_sync_schedule");
    if (error) return { ok: false as const, reason: "غير مصرّح أو تعذّر قراءة الجدولة" };
    return { ok: true as const, schedule: data as {
      exists: boolean;
      jobid?: number;
      schedule?: string;
      active?: boolean;
      lastStatus?: string | null;
      lastRunAt?: string | null;
    } };
  });

/** تحديث فترة المزامنة التلقائية (تعبير cron) أو إيقافها — للمشرفين فقط */
export const setSyncSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { schedule?: unknown; active?: unknown };
    const schedule = String(d?.schedule ?? "").trim().slice(0, 40);
    return { schedule, active: d?.active !== false };
  })
  .handler(async ({ data, context }) => {
    if (!/^[0-9*/,\- ]{5,40}$/.test(data.schedule)) {
      return { ok: false as const, reason: "صيغة الجدولة غير صحيحة" };
    }
    const { error } = await (context.supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("set_sync_schedule", {
      _schedule: data.schedule,
      _active: data.active,
    });
    if (error) return { ok: false as const, reason: "غير مصرّح — هذه الخطوة للمشرفين فقط" };
    return { ok: true as const, schedule: data.schedule, active: data.active };
  });
