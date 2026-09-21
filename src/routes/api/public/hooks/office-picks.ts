import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;
  try {
    const { runOfficePicksSync } = await import("@/lib/office-picks.server");
    return Response.json({ success: true, ...(await runOfficePicksSync()) });
  } catch (error) {
    console.error("office picks sync failed", error);
    return Response.json({ error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/office-picks")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
