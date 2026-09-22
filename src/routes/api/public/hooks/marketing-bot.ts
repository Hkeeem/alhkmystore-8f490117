import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";
import { MARKETING_PLATFORMS, type MarketingPlatform } from "@/lib/marketing-bot.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const platform = (url.searchParams.get("platform") ?? "store") as MarketingPlatform;
  if (!(MARKETING_PLATFORMS as readonly string[]).includes(platform)) {
    return Response.json({ error: "unknown_platform" }, { status: 400 });
  }

  try {
    const { runMarketingBot } = await import("@/lib/marketing-bot.server");
    const result = await runMarketingBot(platform);
    return Response.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    console.error("marketing bot failed", platform, error);
    return Response.json({ error: "bot_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/marketing-bot")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
