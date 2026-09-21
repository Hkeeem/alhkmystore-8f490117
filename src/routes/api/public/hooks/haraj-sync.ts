import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;
  try {
    const { runHarajSync } = await import("@/lib/haraj.server");
    return Response.json({ success: true, ...(await runHarajSync()) });
  } catch (error) {
    console.error("haraj sync failed", error);
    return Response.json({ error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/haraj-sync")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
