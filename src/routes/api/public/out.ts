import { createFileRoute } from "@tanstack/react-router";
import { withAmazonTag } from "@/lib/coupons-api";

// تحويل خارجي آمن: أمازون بمعرّف الشراكة، والمتاجر المسجلة في Admitad عبر مسار «متجر حكيم».
// يسمح فقط بالمتاجر المعروفة لمنع إعادة التوجيه المفتوح.
const KNOWN = ["amazon.sa", "amazon.com", "amazon.ae", "noon.com", "jarir.com", "extra.com", "alhkmy.store", "alhkmy.app"];

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const matches = (host: string, base: string) => host === base || host.endsWith("." + base);

export const Route = createFileRoute("/api/public/out")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("u") ?? "";
        let target: URL;
        try {
          target = new URL(raw);
          if (target.protocol !== "https:") throw new Error();
        } catch {
          return new Response("Bad url", { status: 400 });
        }
        const host = target.hostname.replace(/^www\./, "");
        if (host.startsWith("amazon.") || host.endsWith(".amazon.sa")) {
          return Response.redirect(withAmazonTag(target.toString()), 302);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [{ data: stores }, { data: coupons }] = await Promise.all([
          supabaseAdmin
            .from("affiliate_stores")
            .select("site_url, tracking_template")
            .eq("network", "admitad")
            .eq("active", true),
          supabaseAdmin.from("coupons").select("store_url").eq("active", true).not("store_url", "is", null),
        ]);

        const store = (stores ?? []).find((s) => matches(host, hostOf(s.site_url)));
        const tpl = store?.tracking_template?.trim();
        if (tpl && /^https:\/\/[^/]+\/g\//.test(tpl)) {
          const w = new URL(tpl);
          w.searchParams.set("ulp", target.toString());
          w.searchParams.set("subid1", "alhkmy.store");
          return Response.redirect(w.toString(), 302);
        }

        const allowed =
          !!store ||
          KNOWN.some((k) => matches(host, k)) ||
          (coupons ?? []).some((c) => c.store_url && matches(host, hostOf(c.store_url)));
        if (!allowed) return new Response("Unknown store", { status: 400 });
        return Response.redirect(target.toString(), 302);
      },
    },
  },
});
