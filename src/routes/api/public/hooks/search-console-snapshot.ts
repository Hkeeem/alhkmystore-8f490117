import { createFileRoute } from "@tanstack/react-router";

async function runSnapshot(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  const expected = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || apikey !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let siteUrl: string | null = null;
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const parsed = JSON.parse(raw) as { siteUrl?: unknown };
      if (typeof parsed?.siteUrl === "string" && parsed.siteUrl.trim()) siteUrl = parsed.siteUrl.trim();
    }
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const { buildCrawlReport } = await import("@/lib/search-console-report.server");
    const report = await buildCrawlReport(siteUrl);
    if (report.status !== "ok") {
      return Response.json({ success: false, status: report.status }, { status: 200 });
    }
    let emailNotification: { status: string; alerts: number } = { status: "skipped", alerts: 0 };
    try {
      const { notifyDropAlertsByEmail } = await import("@/lib/search-console-alerts.server");
      emailNotification = await notifyDropAlertsByEmail(report.siteUrl);
    } catch (error) {
      console.error("drop alert email notification failed", error);
      emailNotification = { status: "failed", alerts: 0 };
    }

    return Response.json({
      success: true,
      siteUrl: report.siteUrl,
      totals: report.totals,
      alert: report.alert,
      emailNotification,
    });
  } catch (error) {
    console.error("search console snapshot failed", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/search-console-snapshot")({
  server: {
    handlers: {
      POST: async ({ request }) => runSnapshot(request),
    },
  },
});
