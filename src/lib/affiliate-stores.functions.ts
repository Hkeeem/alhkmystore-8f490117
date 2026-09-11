import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const clean = (v: unknown, max = 200) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

export type AffiliateStore = {
  id: string;
  name: string;
  slug: string | null;
  siteUrl: string;
  network: string;
  networkAccountId: string | null;
  networkAccountEmail: string | null;
  trackingTemplate: string | null;
  affiliateParam: string | null;
  category: string | null;
  city: string | null;
  logoUrl: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
};

const NETWORKS = ["amazon", "noon", "arabclicks", "admitad", "impact", "cj", "other"];

type Row = {
  id: string;
  name: string;
  slug: string | null;
  site_url: string;
  network: string;
  network_account_id: string | null;
  network_account_email: string | null;
  tracking_template: string | null;
  affiliate_param: string | null;
  category: string | null;
  city: string | null;
  logo_url: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
};

const toStore = (r: Row): AffiliateStore => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  siteUrl: r.site_url,
  network: r.network,
  networkAccountId: r.network_account_id,
  networkAccountEmail: r.network_account_email,
  trackingTemplate: r.tracking_template,
  affiliateParam: r.affiliate_param,
  category: r.category,
  city: r.city,
  logoUrl: r.logo_url,
  notes: r.notes,
  active: r.active,
  createdAt: r.created_at,
});

/** قائمة متاجر الأفلييت (للموظفين) */
export const staffListAffiliateStores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AffiliateStore[]> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("affiliate_stores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toStore(r as Row));
  });

/** إضافة أو تعديل متجر أفلييت مع ربطه بحساب الشبكة */
export const staffSaveAffiliateStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const network = clean(d.network, 32).toLowerCase() || "other";
    return {
      id: clean(d.id, 64),
      name: clean(d.name, 120),
      slug: clean(d.slug, 64).toLowerCase(),
      siteUrl: clean(d.siteUrl, 500),
      network: NETWORKS.includes(network) ? network : "other",
      networkAccountId: clean(d.networkAccountId, 120),
      networkAccountEmail: clean(d.networkAccountEmail, 160),
      trackingTemplate: clean(d.trackingTemplate, 500),
      affiliateParam: clean(d.affiliateParam, 64),
      category: clean(d.category, 64),
      city: clean(d.city, 64),
      logoUrl: clean(d.logoUrl, 500),
      notes: clean(d.notes, 500),
      active: d.active !== false,
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    if (!data.name || !data.siteUrl) throw new Error("اسم المتجر ورابط الموقع مطلوبان");
    try {
      const u = new URL(data.siteUrl);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad");
    } catch {
      throw new Error("رابط الموقع غير صالح");
    }

    const payload = {
      name: data.name,
      slug: data.slug || null,
      site_url: data.siteUrl,
      network: data.network,
      network_account_id: data.networkAccountId || null,
      network_account_email: data.networkAccountEmail || null,
      tracking_template: data.trackingTemplate || null,
      affiliate_param: data.affiliateParam || null,
      category: data.category || null,
      city: data.city || null,
      logo_url: data.logoUrl || null,
      notes: data.notes || null,
      active: data.active,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("affiliate_stores")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("affiliate_stores")
      .insert({ ...payload, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

/** حذف متجر أفلييت */
export const staffDeleteAffiliateStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({ id: clean((data as { id?: unknown } | null)?.id, 64) }))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { error } = await context.supabase.from("affiliate_stores").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type StoreCandidate = {
  name: string;
  siteUrl: string;
  network: string;
  category?: string;
  logoUrl?: string;
  source: string;
};

function networkFromUrl(url: string) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h.includes("amazon") || h.includes("amzn")) return "amazon";
    if (h.includes("noon")) return "noon";
    return "other";
  } catch {
    return "other";
  }
}

/** بحث عن متاجر مرشحة من نتائج العروض الحالية لتعبئة النموذج بضغطة واحدة */
export const staffSearchStoreCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ({ q: clean((data as { q?: unknown } | null)?.q, 80) }))
  .handler(async ({ data, context }): Promise<StoreCandidate[]> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const q = data.q;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let extQ = supabaseAdmin
      .from("external_deals")
      .select("store_name, store_id, product_url, category, image_url")
      .limit(200);
    if (q) extQ = extQ.ilike("store_name", `%${q}%`);

    let merQ = supabaseAdmin
      .from("merchants")
      .select("name, slug, website, category, logo_url")
      .limit(200);
    if (q) merQ = merQ.ilike("name", `%${q}%`);

    const [ext, mer] = await Promise.all([extQ, merQ]);

    const seen = new Set<string>();
    const out: StoreCandidate[] = [];

    for (const r of mer.data ?? []) {
      const site = r.website ?? "";
      const key = (r.name ?? "").toLowerCase();
      if (!r.name || seen.has(key)) continue;
      seen.add(key);
      out.push({
        name: r.name,
        siteUrl: site,
        network: networkFromUrl(site),
        category: r.category ?? undefined,
        logoUrl: r.logo_url ?? undefined,
        source: "تاجر مسجّل",
      });
    }

    for (const r of ext.data ?? []) {
      const name = r.store_name || r.store_id;
      const key = (name ?? "").toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      let site = "";
      try {
        site = r.product_url ? new URL(r.product_url).origin : "";
      } catch {
        site = "";
      }
      out.push({
        name,
        siteUrl: site,
        network: networkFromUrl(site),
        category: r.category ?? undefined,
        logoUrl: r.image_url ?? undefined,
        source: "نتائج البحث الخارجية",
      });
    }

    return out.slice(0, 40);
  });
