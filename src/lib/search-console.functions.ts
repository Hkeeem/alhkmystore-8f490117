import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSearchConsoleProperties = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { listVerifiedProperties, SITE_TARGET } = await import("@/lib/search-console-config.server");
    try {
      return { ok: true as const, properties: await listVerifiedProperties(SITE_TARGET) };
    } catch (error) {
      return {
        ok: false as const,
        properties: [] as string[],
        error: error instanceof Error ? error.message : "unknown_error",
      };
    }
  });

export const getCrawlReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const siteUrl = (input as { siteUrl?: unknown })?.siteUrl;
    return { siteUrl: typeof siteUrl === "string" && siteUrl ? siteUrl : null };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { buildCrawlReport } = await import("@/lib/search-console-report.server");
    return buildCrawlReport(data.siteUrl);
  });

export const inspectPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = input as { siteUrl?: unknown; paths?: unknown };
    const paths = Array.isArray(raw?.paths)
      ? raw.paths.filter((p): p is string => typeof p === "string" && p.trim().length > 0).slice(0, 25)
      : [];
    return {
      siteUrl: typeof raw?.siteUrl === "string" && raw.siteUrl ? raw.siteUrl : null,
      paths,
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    if (data.paths.length === 0) return { status: "error" as const, error: "no_paths_selected" };
    const { inspectSelectedPaths } = await import("@/lib/search-console-report.server");
    return inspectSelectedPaths(data.siteUrl, data.paths);
  });

export const listCrawlSnapshots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { data } = await context.supabase
      .from("search_console_snapshots")
      .select("id, site_url, submitted, indexed, sitemap_errors, sitemap_warnings, inspected_urls, indexed_urls, details, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });

