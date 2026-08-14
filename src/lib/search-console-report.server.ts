import { inspectUrls, listSitemaps, listVerifiedProperties } from "@/lib/search-console.server";
import { MONITORED_PATHS, SITE_TARGET } from "@/lib/search-console-config.server";

export type BaselineMode = "last" | "avg7" | "auto";

export type CrawlReport =
  | { status: "error"; error: string }
  | { status: "selection_required"; candidates: string[] }
  | {
      status: "ok";
      siteUrl: string;
      sitemaps: Awaited<ReturnType<typeof listSitemaps>>;
      inspections: Awaited<ReturnType<typeof inspectUrls>>;
      totals: {
        submitted: number;
        indexed: number;
        errors: number;
        warnings: number;
        inspected: number;
        indexedUrls: number;
      };
      previous: { indexed: number; indexedUrls: number; createdAt: string } | null;
      baseline: { mode: "last" | "avg7"; label: string; samples: number };
      alert: { level: "drop" | "sitemap_errors" | "none"; message: string; delta: number };
    };

export async function buildCrawlReport(
  selectedSiteUrl: string | null,
  baselineMode: BaselineMode = "auto",
): Promise<CrawlReport> {

  let siteUrl = selectedSiteUrl;
  try {
    const properties = await listVerifiedProperties(SITE_TARGET);
    if (properties.length === 0) return { status: "error", error: "no_verified_property" };
    if (siteUrl) {
      if (!properties.includes(siteUrl)) return { status: "error", error: "property_not_verified" };
    } else if (properties.length === 1) {
      siteUrl = properties[0]!;
    } else {
      return { status: "selection_required", candidates: properties };
    }

    const sitemaps = await listSitemaps(siteUrl);
    const origin = new URL(SITE_TARGET).origin;
    const inspections = await inspectUrls(
      siteUrl,
      MONITORED_PATHS.map((p) => `${origin}${p}`),
    );

    const totals = {
      submitted: sitemaps.reduce((s, m) => s + m.submitted, 0),
      indexed: sitemaps.reduce((s, m) => s + m.indexed, 0),
      errors: sitemaps.reduce((s, m) => s + m.errors, 0),
      warnings: sitemaps.reduce((s, m) => s + m.warnings, 0),
      inspected: inspections.length,
      indexedUrls: inspections.filter((i) => i.isIndexed).length,
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prev } = await supabaseAdmin
      .from("search_console_snapshots")
      .select("indexed, indexed_urls, created_at")
      .eq("site_url", siteUrl)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previous = prev
      ? { indexed: prev.indexed, indexedUrls: prev.indexed_urls, createdAt: prev.created_at }
      : null;

    const delta = previous ? totals.indexedUrls - previous.indexedUrls : 0;

    let alert: { level: "drop" | "sitemap_errors" | "none"; message: string; delta: number } = {
      level: "none",
      message: "لا يوجد انخفاض في الفهرسة منذ آخر فحص.",
      delta,
    };
    if (previous && delta < 0) {
      alert = {
        level: "drop",
        message: `انخفض عدد الصفحات المفهرسة بمقدار ${Math.abs(delta)} صفحة بعد آخر تحديث للعروض.`,
        delta,
      };
    } else if (totals.errors > 0) {
      alert = {
        level: "sitemap_errors",
        message: `Search Console يبلّغ عن ${totals.errors} خطأ في ملف الخريطة.`,
        delta,
      };
    }

    await supabaseAdmin.from("search_console_snapshots").insert({
      site_url: siteUrl,
      submitted: totals.submitted,
      indexed: totals.indexed,
      sitemap_errors: totals.errors,
      sitemap_warnings: totals.warnings,
      inspected_urls: totals.inspected,
      indexed_urls: totals.indexedUrls,
      details: { sitemaps, inspections },
    });

    if (alert.level === "drop") {
      await notifyStaff(alert.message);
    }

    return { status: "ok", siteUrl, sitemaps, inspections, totals, previous, alert };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : "unknown_error" };
  }
}

async function notifyStaff(message: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["super_admin", "admin", "support", "content_manager"]);
    const ids = Array.from(new Set((staff ?? []).map((r) => r.user_id)));
    if (ids.length === 0) return;
    await supabaseAdmin.from("notifications").insert(
      ids.map((user_id) => ({
        user_id,
        title: "انخفاض في الصفحات المفهرسة",
        body: message,
        link: "/search-console",
      })),
    );
  } catch (error) {
    console.error("search console alert fan-out failed", error);
  }
}

export type UrlInspectionReport =
  | { status: "error"; error: string }
  | { status: "selection_required"; candidates: string[] }
  | {
      status: "ok";
      siteUrl: string;
      inspections: Awaited<ReturnType<typeof inspectUrls>>;
      totals: { inspected: number; indexedUrls: number };
    };

export async function inspectSelectedPaths(
  selectedSiteUrl: string | null,
  paths: string[],
): Promise<UrlInspectionReport> {
  try {
    const properties = await listVerifiedProperties(SITE_TARGET);
    if (properties.length === 0) return { status: "error", error: "no_verified_property" };
    let siteUrl = selectedSiteUrl;
    if (siteUrl) {
      if (!properties.includes(siteUrl)) return { status: "error", error: "property_not_verified" };
    } else if (properties.length === 1) {
      siteUrl = properties[0]!;
    } else {
      return { status: "selection_required", candidates: properties };
    }

    const origin = new URL(SITE_TARGET).origin;
    const urls = paths.map((p) => (p.startsWith("http") ? p : `${origin}${p.startsWith("/") ? p : `/${p}`}`));
    const inspections = await inspectUrls(siteUrl, urls);
    const totals = {
      inspected: inspections.length,
      indexedUrls: inspections.filter((i) => i.isIndexed).length,
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("search_console_snapshots").insert({
      site_url: siteUrl,
      submitted: 0,
      indexed: 0,
      sitemap_errors: 0,
      sitemap_warnings: 0,
      inspected_urls: totals.inspected,
      indexed_urls: totals.indexedUrls,
      details: { mode: "url_inspection", inspections },
    });

    return { status: "ok", siteUrl, inspections, totals };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : "unknown_error" };
  }
}
