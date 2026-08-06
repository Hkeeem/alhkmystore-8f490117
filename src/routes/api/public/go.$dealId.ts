import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const paramsSchema = z.object({ dealId: z.string().uuid() });

type Network = "amazon" | "noon" | "other";

function detectNetwork(url: URL): Network {
  const h = url.hostname.replace(/^www\./, "");
  if (h.endsWith("amazon.sa") || h.endsWith("amazon.com") || h.endsWith("amzn.to")) return "amazon";
  if (h.endsWith("noon.com")) return "noon";
  return "other";
}

/** إضافة معرّفات الشراكة على الخادم فقط — لا تظهر أبداً في الواجهة */
function decorate(url: URL, network: Network, dealId: string) {
  const amazonTag = process.env["AMAZON_PARTNER_TAG"];
  const noonTag = process.env["NOON_AFFILIATE_ID"];

  if (network === "amazon" && amazonTag) {
    url.searchParams.set("tag", amazonTag);
    url.searchParams.set("linkCode", "ll1");
  }
  if (network === "noon" && noonTag) {
    url.searchParams.set("utm_source", noonTag);
  }
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", "hkeeem-ai");
  url.searchParams.set("utm_content", dealId);
  return url;
}

export const Route = createFileRoute("/api/public/go/$dealId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const parsed = paramsSchema.safeParse(params);
        if (!parsed.success) return new Response("Not found", { status: 404 });
        const dealId = parsed.data.dealId;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: deal, error } = await supabaseAdmin
          .from("merchant_deals")
          .select("id, product_url, status")
          .eq("id", dealId)
          .eq("status", "published")
          .maybeSingle();

        if (error || !deal?.product_url) {
          return Response.redirect(new URL(`/deals`, request.url).toString(), 302);
        }

        let target: URL;
        try {
          target = new URL(deal.product_url);
        } catch {
          return Response.redirect(new URL(`/deals`, request.url).toString(), 302);
        }
        if (target.protocol !== "https:" && target.protocol !== "http:") {
          return Response.redirect(new URL(`/deals`, request.url).toString(), 302);
        }

        const network = detectNetwork(target);
        const source = new URL(request.url).searchParams.get("s")?.slice(0, 120) ?? null;

        // التتبع لا يعطّل التحويل أبداً
        let dbg = "ok";
        try {
          const { error: trackError } = await supabaseAdmin.rpc("register_affiliate_click", {
            _deal_id: dealId,
            _network: network,
            _source: source ?? undefined,
            _referrer: request.headers.get("referer") ?? undefined,
            _user_agent: request.headers.get("user-agent") ?? undefined,
            _country: request.headers.get("cf-ipcountry") ?? undefined,
          });
          if (trackError) dbg = JSON.stringify(trackError);
        } catch (e) {
          dbg = String(e);
        }

        return new Response(null, {
          status: 302,
          headers: {
            location: decorate(target, network, dealId).toString(),
            "cache-control": "no-store, private",
            "referrer-policy": "no-referrer",
            "x-robots-tag": "noindex, nofollow",
          },
        });
      },
    },
  },
});
