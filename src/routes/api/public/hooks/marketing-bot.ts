import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";
import { MARKETING_PLATFORMS, type MarketingPlatform } from "@/lib/marketing-bot.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const platform = (url.searchParams.get("platform") ?? "") as MarketingPlatform;
  if (!MARKETING_PLATFORMS.includes(platform)) {
    return Response.json({ error: "unknown platform" }, { status: 400 });
  }

  try {
    const { runMarketingBot } = await import("@/lib/marketing-bot.server");
    const result = await runMarketingBot(platform);
    return Response.json({ success: true, ...result });
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
