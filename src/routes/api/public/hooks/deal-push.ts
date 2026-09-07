import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  const expected = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || apikey !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

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
