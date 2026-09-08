import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

/**
 * نقطة نهاية التقرير الأسبوعي التلقائي — تُستدعى من الجدولة (pg_cron) أسبوعيًا.
 * محمية بسر داخلي عبر ترويسة x-cron-secret (لا يصل للمتصفح).
 */
async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

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
