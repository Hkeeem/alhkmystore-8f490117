import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;
  try {
    const { runSocialSync } = await import("@/lib/social-sync.server");
    const result = await runSocialSync();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("social sync failed", error);
    return Response.json({ error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/social-sync")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
