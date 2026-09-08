import { createFileRoute } from "@tanstack/react-router";
import { assertCronRequest } from "@/lib/cron-auth.server";
import { z } from "zod";

const bodySchema = z
  .object({
    keywords: z.array(z.string().min(2).max(60)).max(20).optional(),
  })
  .optional();

async function runSync(request: Request) {
  const denied = await assertCronRequest(request);
  if (denied) return denied;

  let keywords: string[] | undefined;
  try {
    const raw = await request.text();
    if (raw.trim()) keywords = bodySchema.parse(JSON.parse(raw))?.keywords;
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const { syncExternalDeals } = await import("@/lib/external-sync.server");
    const result = await syncExternalDeals(keywords?.length ? keywords : undefined);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("external deals sync failed", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-external-deals")({
  server: {
    handlers: {
      POST: async ({ request }) => runSync(request),
    },
  },
});
