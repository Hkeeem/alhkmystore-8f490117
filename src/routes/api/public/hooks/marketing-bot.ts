import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const { assertCronRequest } = await import("@/lib/cron-auth.server");
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  try {
    const platform = new URL(request.url).searchParams.get("platform");
    const mod = await import("@/lib/marketing-bot.server");
    if (platform && mod.isMarketingPlatform(platform)) {
      return Response.json({ success: true, results: [await mod.runMarketingBot(platform)] });
    }
    return Response.json({ success: true, results: await mod.runAllMarketingBots() });
  } catch (error) {
    console.error("marketing bot failed", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/marketing-bot")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
