import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { deals } from "@/data/deals";
import { coupons } from "@/data/coupons";
import { REWARDS_CATALOG } from "@/lib/rewards";

const BASE_URL = "https://alhkmystore.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/**
 * أحدث وقت تحديث للعروض الحيّة (عروض التجار المنشورة + العروض الخارجية النشطة).
 * يُستخدم كـ lastmod لصفحات قوائم العروض حتى تعرف محركات البحث أن المحتوى تغيّر.
 */
async function latestDealsUpdatedAt(): Promise<{ merchant?: string; external?: string; any?: string }> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return {};

  try {
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const nowIso = new Date().toISOString();
    const [merchantRes, externalRes] = await Promise.all([
      supabase
        .from("merchant_deals")
        .select("updated_at")
        .eq("status", "published")
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("external_deals")
        .select("updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    const merchant = merchantRes.data?.[0]?.updated_at ?? undefined;
    const external = externalRes.data?.[0]?.updated_at ?? undefined;
    const any = [merchant, external].filter(Boolean).sort().at(-1);
    return { merchant, external, any };
  } catch (error) {
    console.error("sitemap: failed to read latest deal timestamps", error);
    return {};
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const latest = await latestDealsUpdatedAt();

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0", lastmod: latest.any },
          { path: "/deals", changefreq: "daily", priority: "0.9", lastmod: latest.any },
          { path: "/deals/panda-vs-othaim-comparison", changefreq: "weekly", priority: "0.8" },
          { path: "/coupons", changefreq: "daily", priority: "0.8" },
          { path: "/stores", changefreq: "weekly", priority: "0.7", lastmod: latest.merchant },
          { path: "/market", changefreq: "daily", priority: "0.7", lastmod: latest.any },
          { path: "/compare", changefreq: "weekly", priority: "0.7", lastmod: latest.external },
          { path: "/smart-list", changefreq: "weekly", priority: "0.6" },
          { path: "/maps", changefreq: "weekly", priority: "0.6" },
          { path: "/real-estate", changefreq: "weekly", priority: "0.6" },
          { path: "/cars", changefreq: "weekly", priority: "0.6" },
          { path: "/analysis", changefreq: "weekly", priority: "0.6" },
          { path: "/rewards", changefreq: "weekly", priority: "0.6" },
          { path: "/chat", changefreq: "monthly", priority: "0.5" },
          { path: "/ads", changefreq: "monthly", priority: "0.4" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          ...deals.map((d) => ({
            path: `/deals/${d.id}`,
            changefreq: "daily" as const,
            priority: "0.7",
          })),
          ...coupons.map((c) => ({
            path: `/coupons/${c.id}`,
            changefreq: "weekly" as const,
            priority: "0.6",
          })),
          ...REWARDS_CATALOG.map((r) => ({
            path: `/rewards/${r.id}`,
            changefreq: "monthly" as const,
            priority: "0.4",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            // تحديث متكرر حتى تعكس الخريطة العروض الجديدة بسرعة
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
