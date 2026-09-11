import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  const expected =
    process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || apikey !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { runOfficePicksSync } = await import("@/lib/office-picks.server");
    return Response.json({ success: true, ...(await runOfficePicksSync()) });
  } catch (error) {
    console.error("office picks sync failed", error);
    return Response.json({ error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/office-picks")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
