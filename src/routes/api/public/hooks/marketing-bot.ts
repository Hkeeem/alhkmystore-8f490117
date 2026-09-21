import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";
import { runMarketingBots } from "@/lib/marketing-bot.server";

async function run(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  const platform = new URL(request.url).searchParams.get("platform") ?? undefined;

  try {
    const result = await runMarketingBots(platform ?? undefined);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("marketing bot run failed", error);
    return Response.json({ error: "marketing_bot_failed" }, { status: 500 });
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
