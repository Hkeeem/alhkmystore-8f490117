import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function runSnapshot(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  let siteUrl: string | null = null;
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const parsed = JSON.parse(raw) as { siteUrl?: unknown };
      if (typeof parsed?.siteUrl === "string" && parsed.siteUrl.trim())
        siteUrl = parsed.siteUrl.trim();
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
    return Response.json({
      success: true,
      siteUrl: report.siteUrl,
      totals: report.totals,
      alert: report.alert,
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
