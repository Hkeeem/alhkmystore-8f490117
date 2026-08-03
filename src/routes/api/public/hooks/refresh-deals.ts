import { createFileRoute } from "@tanstack/react-router";

/**
 * نقطة تحديث العروض الحقيقية (تُستدعى من المجدول أو يدوياً من الإدارة).
 * الحماية: مفتاح النشر العام (apikey) كما هو معتمد في مهام pg_cron.
 */
export const Route = createFileRoute("/api/public/hooks/refresh-deals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];

        if (!apiKey || !expected || apiKey !== expected) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        const { crawlAllSources } = await import("@/lib/crawler.server");
        const results = await crawlAllSources();
        const total = results.reduce((sum, r) => sum + r.saved, 0);

        // إخفاء العروض المنتهية
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("external_deals")
          .update({ active: false })
          .lt("expires_at", new Date().toISOString())
          .eq("active", true);

        return Response.json({ ok: true, total, results });
      },
    },
  },
});
