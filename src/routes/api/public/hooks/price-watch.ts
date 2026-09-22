import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  try {
    const { runPriceWatch } = await import("@/lib/price-watch.server");
    const result = await runPriceWatch();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("price watch failed", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/price-watch")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
