import { createFileRoute } from "@tanstack/react-router";

async function run(request: Request) {
  const apikey = request.headers.get("apikey") ?? "";
  const expected =
    process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || apikey !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { runHarajSync } = await import("@/lib/haraj.server");
    return Response.json({ success: true, ...(await runHarajSync()) });
  } catch (error) {
    console.error("haraj sync failed", error);
    return Response.json({ error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/haraj-sync")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
