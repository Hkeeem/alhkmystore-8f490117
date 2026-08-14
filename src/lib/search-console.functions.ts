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
    const raw = input as { siteUrl?: unknown; baseline?: unknown };
    const baseline = raw?.baseline === "last" || raw?.baseline === "avg7" ? raw.baseline : "auto";
    return {
      siteUrl: typeof raw?.siteUrl === "string" && raw.siteUrl ? raw.siteUrl : null,
      baseline: baseline as "last" | "avg7" | "auto",
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { buildCrawlReport } = await import("@/lib/search-console-report.server");
    return buildCrawlReport(data.siteUrl, data.baseline);
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


/** حالة المهمة المجدولة لتحديث لقطات Search Console — للفريق الإداري */
export const getSnapshotSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)("get_search_console_schedule");
    if (error) return { ok: false as const, reason: "غير مصرّح أو تعذّر قراءة الجدولة" };
    return {
      ok: true as const,
      schedule: data as {
        exists: boolean;
        jobid?: number;
        schedule?: string;
        active?: boolean;
        lastStatus?: string | null;
        lastRunAt?: string | null;
      },
    };
  });

/** تعديل فترة المهمة المجدولة أو إيقافها — للمشرفين فقط */
export const setSnapshotSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = (input ?? {}) as { schedule?: unknown; active?: unknown };
    return { schedule: String(d.schedule ?? "").trim().slice(0, 40), active: d.active !== false };
  })
  .handler(async ({ data, context }) => {
    if (!/^[0-9*/,\- ]{5,40}$/.test(data.schedule)) {
      return { ok: false as const, reason: "صيغة الجدولة غير صحيحة" };
    }
    const { error } = await (context.supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("set_search_console_schedule", {
      _schedule: data.schedule,
      _active: data.active,
    });
    if (error) return { ok: false as const, reason: "غير مصرّح — هذه الخطوة للمشرفين فقط" };
    return { ok: true as const, schedule: data.schedule, active: data.active };
  });

/** اتجاه الفهرسة والزحف خلال آخر 30 يوماً — للفريق الإداري */
export const getIndexingTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await context.supabase
      .from("search_console_snapshots")
      .select("submitted, indexed, inspected_urls, indexed_urls, sitemap_errors, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(500);

    const byDay = new Map<
      string,
      { day: string; indexedUrls: number; inspected: number; crawled: number; submitted: number; errors: number }
    >();
    for (const row of data ?? []) {
      const day = String(row.created_at).slice(0, 10);
      byDay.set(day, {
        day,
        indexedUrls: row.indexed_urls ?? 0,
        inspected: row.inspected_urls ?? 0,
        crawled: row.indexed ?? 0,
        submitted: row.submitted ?? 0,
        errors: row.sitemap_errors ?? 0,
      });
    }
    return Array.from(byDay.values());
  });
