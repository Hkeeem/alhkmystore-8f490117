import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;
  try {
    const { runShowroomSync } = await import("@/lib/showroom.server");
    return Response.json({ success: true, ...(await runShowroomSync()) });
  } catch (error) {
    console.error("showroom sync failed", error);
    return Response.json({ error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/showroom-sync")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
