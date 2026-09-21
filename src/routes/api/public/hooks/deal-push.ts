import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  try {
    const { runDealPushSweep } = await import("@/lib/deal-push.server");
    const result = await runDealPushSweep();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("deal push sweep failed", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/deal-push")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
