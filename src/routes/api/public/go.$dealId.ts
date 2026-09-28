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

/** إضافة معرّفات الشراكة + وسم التتبع (subid) على الخادم فقط — لا تظهر أبداً في الواجهة */
async function decorate(url: URL, network: Network, dealId: string, clickId: string | null) {
  const { getIntegrationKey } = await import("@/lib/integration-keys.server");
  const amazonTag = network === "amazon" ? await getIntegrationKey("AMAZON_PARTNER_TAG") : null;
  const noonTag = network === "noon" ? await getIntegrationKey("NOON_AFFILIATE_ID") : null;

  if (network === "amazon" && amazonTag) {
    url.searchParams.set("tag", amazonTag);
    url.searchParams.set("linkCode", "ll1");
    // أمازون تُرجع هذا الوسم داخل تقارير/Postback المبيعات
    if (clickId) url.searchParams.set("ascsubtag", clickId);
  }
  if (network === "noon" && noonTag) {
    url.searchParams.set("utm_source", noonTag);
  }
  if (clickId && network !== "amazon") url.searchParams.set("subid", clickId);
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", "hkeeem-ai");
  url.searchParams.set("utm_content", dealId);
  if (clickId) url.searchParams.set("utm_id", clickId);
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
        let clickId: string | null = null;
        try {
          const { data: newClickId, error: trackError } = await supabaseAdmin.rpc(
            "register_affiliate_click_returning",
            {
              _deal_id: dealId,
              _network: network,
              _source: source ?? undefined,
              _referrer: request.headers.get("referer") ?? undefined,
              _user_agent: request.headers.get("user-agent") ?? undefined,
              _country: request.headers.get("cf-ipcountry") ?? undefined,
            },
          );
          if (trackError) console.error("affiliate click tracking failed", trackError);
          else clickId = (newClickId as string | null) ?? null;
        } catch (e) {
          console.error("affiliate click tracking threw", e);
        }

        let finalUrl = (await decorate(target, network, dealId, clickId)).toString();

        // Admitad: لف الرابط بمسار التتبع الخاص بمساحة «متجر حكيم» (alhkmy.store) إن وُجد للمتجر
        if (network !== "amazon") {
          try {
            const host = target.hostname.replace(/^www\./, "");
            const { data: stores } = await supabaseAdmin
              .from("affiliate_stores")
              .select("site_url, tracking_template")
              .eq("network", "admitad")
              .eq("active", true)
              .not("tracking_template", "is", null);
            const match = (stores ?? []).find((s) => {
              try {
                const sh = new URL(s.site_url).hostname.replace(/^www\./, "");
                return host === sh || host.endsWith("." + sh);
              } catch {
                return false;
              }
            });
            const tpl = match?.tracking_template?.trim();
            if (tpl && /^https:\/\/[^/]+\/g\//.test(tpl)) {
              const w = new URL(tpl);
              w.searchParams.set("ulp", finalUrl);
              if (clickId) w.searchParams.set("subid", clickId);
              w.searchParams.set("subid1", "alhkmy.store");
              finalUrl = w.toString();
            }
          } catch (e) {
            console.error("admitad wrap failed", e);
          }
        }

        return new Response(null, {
          status: 302,
          headers: {
            location: finalUrl,
            "cache-control": "no-store, private",
            "referrer-policy": "no-referrer",
            "x-robots-tag": "noindex, nofollow",
          },
        });
      },
    },
  },
});
