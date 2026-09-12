import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;
  try {
    const [{ runShowroomSync }, { syncExternalDeals }, { runOfficePicksSync }] = await Promise.all([
      import("@/lib/showroom.server"),
      import("@/lib/external-sync.server"),
      import("@/lib/office-picks.server"),
    ]);
    const [showroom, shopping, office] = await Promise.all([
      runShowroomSync(60),
      syncExternalDeals(undefined, "all"),
      runOfficePicksSync(20),
    ]);
    return Response.json({ success: true, showroom, shopping, office });
  } catch (error) {
    console.error("daily content sync failed", error);
    return Response.json({ success: false, error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/daily-content-sync")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
