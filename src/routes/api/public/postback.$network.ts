import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * نقطة استقبال Postback/Webhook من شبكات الأفلييت لتسجيل التحويلات (المبيعات).
 *
 * الرابط:
 *   /api/public/postback/<network>?key=<AFFILIATE_POSTBACK_SECRET>&order_id=...&click_id=...&amount=...&commission=...&status=...
 * أو POST بنفس الحقول (JSON أو form) مع ترويسة x-postback-secret.
 *
 * click_id هو نفس المعرّف الذي نمرره للشبكة كـ subid/ascsubtag من /api/public/go/:dealId
 */

const NETWORKS = ["amazon", "noon", "other"] as const;

const payloadSchema = z.object({
  order_id: z.string().trim().min(1).max(160),
  click_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().min(0).max(10_000_000).optional().default(0),
  commission: z.coerce.number().min(0).max(10_000_000).optional().default(0),
  currency: z.string().trim().min(2).max(8).optional().default("SAR"),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional().default("pending"),
});

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  if (request.method !== "POST") return query;
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return { ...query, ...body };
    }
    const form = await request.formData();
    return { ...query, ...Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) };
  } catch {
    return query;
  }
}

async function handle(request: Request, networkParam: string) {
  const secret = process.env["AFFILIATE_POSTBACK_SECRET"];
  if (!secret) return json({ error: "postback_not_configured" }, 503);

  const url = new URL(request.url);
  const provided = request.headers.get("x-postback-secret") ?? url.searchParams.get("key") ?? "";
  if (!timingSafeEqual(provided, secret)) return json({ error: "unauthorized" }, 401);

  const network = (NETWORKS as readonly string[]).includes(networkParam) ? networkParam : "other";

  const raw = await readPayload(request);
  const parsed = payloadSchema.safeParse({
    order_id: raw["order_id"] ?? raw["orderId"] ?? raw["order"] ?? raw["transaction_id"],
    click_id:
      raw["click_id"] ??
      raw["clickId"] ??
      raw["subid"] ??
      raw["sub_id"] ??
      raw["ascsubtag"] ??
      undefined,
    deal_id: raw["deal_id"] ?? raw["dealId"] ?? undefined,
    amount: raw["amount"] ?? raw["sale_amount"] ?? raw["value"] ?? 0,
    commission: raw["commission"] ?? raw["payout"] ?? 0,
    currency: raw["currency"] ?? "SAR",
    status: raw["status"] ?? "pending",
  });
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);
  const data = parsed.data;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // اربط التحويل بالنقرة الأصلية إن وُجدت — ومنها نستنتج العرض
  let dealId = data.deal_id ?? null;
  let clickId = data.click_id ?? null;
  if (clickId) {
    const { data: click } = await supabaseAdmin
      .from("affiliate_clicks")
      .select("id, deal_id")
      .eq("id", clickId)
      .maybeSingle();
    if (click) dealId = dealId ?? click.deal_id;
    else clickId = null;
  }

  const { error } = await supabaseAdmin.from("affiliate_conversions").upsert(
    {
      click_id: clickId,
      deal_id: dealId,
      network,
      order_id: data.order_id,
      status: data.status,
      amount: data.amount,
      commission: data.commission,
      currency: data.currency.toUpperCase(),
      raw: raw as never,
    },
    { onConflict: "network,order_id" },
  );

  if (error) {
    console.error("postback upsert failed", error);
    return json({ error: "storage_failed" }, 500);
  }

  return json({ ok: true, network, order_id: data.order_id, matched_click: Boolean(clickId) });
}

export const Route = createFileRoute("/api/public/postback/$network")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, params.network),
      POST: async ({ request, params }) => handle(request, params.network),
    },
  },
});
