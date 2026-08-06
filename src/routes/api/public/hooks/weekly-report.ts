import { createFileRoute } from "@tanstack/react-router";

/**
 * نقطة نهاية التقرير الأسبوعي التلقائي — تُستدعى من الجدولة (pg_cron) أسبوعيًا.
 * محمية بمفتاح anon عبر ترويسة apikey.
 */
async function run(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  const expected = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || apikey !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let days = 7;
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const body = JSON.parse(raw) as { days?: unknown };
      const value = Number(body?.days);
      if (Number.isFinite(value) && value > 0) days = Math.min(90, Math.floor(value));
    }
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const { runWeeklyReport } = await import("@/lib/weekly-report.server");
    const result = await runWeeklyReport({ days, triggeredBy: "cron" });
    return Response.json({ success: result.sent, recipients: result.recipients, error: result.error ?? null });
  } catch (error) {
    console.error("weekly report failed", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/weekly-report")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
    },
  },
});
