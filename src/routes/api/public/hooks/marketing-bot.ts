import { createFileRoute } from "@tanstack/react-router";
import { MARKETING_PLATFORMS, type MarketingPlatform } from "@/lib/marketing-bot.server";

async function run(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  const expected =
    process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || apikey !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

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
