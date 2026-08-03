/**
 * سحب العروض الحقيقية من مواقع المتاجر السعودية عبر Firecrawl.
 * المتاجر الكبرى تحجب السحب المباشر، لذلك نستعمل Firecrawl (يتعامل مع
 * جافاسكربت والحماية من البوتات) ثم نخزّن النتائج في جدول external_deals.
 */

export type CrawlSourceId = "jarir" | "extra" | "noon" | "panda" | "othaim" | "nahdi";

type SourceConfig = {
  id: CrawlSourceId;
  storeName: string;
  category: string;
  url: string;
};

export const CRAWL_SOURCES: SourceConfig[] = [
  { id: "jarir", storeName: "مكتبة جرير", category: "إلكترونيات", url: "https://www.jarir.com/sa-ar/" },
  { id: "extra", storeName: "إكسترا", category: "إلكترونيات", url: "https://www.extra.com/ar-sa/deals/" },
  { id: "noon", storeName: "نون", category: "إلكترونيات", url: "https://www.noon.com/saudi-ar/deals/" },
  { id: "panda", storeName: "بنده", category: "سوبرماركت", url: "https://panda.sa/ar/offers" },
  { id: "othaim", storeName: "أسواق العثيم", category: "سوبرماركت", url: "https://othaimmarkets.com/ar/offers" },
  { id: "nahdi", storeName: "صيدليات النهدي", category: "صيدلية", url: "https://www.nahdionline.com/ar/offers" },
];

export type CrawledOffer = {
  sourceKey: string;
  title: string;
  brand?: string | null;
  unit?: string | null;
  price: number;
  originalPrice: number;
  imageUrl?: string | null;
  productUrl?: string | null;
};

const OFFER_SCHEMA = {
  type: "object",
  properties: {
    offers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          brand: { type: "string" },
          unit: { type: "string" },
          price: { type: "number" },
          originalPrice: { type: "number" },
          imageUrl: { type: "string" },
          productUrl: { type: "string" },
        },
        required: ["title", "price"],
      },
    },
  },
  required: ["offers"],
} as const;

export function firecrawlConfigured() {
  return Boolean(process.env["FIRECRAWL_API_KEY"]);
}

async function firecrawlScrape(url: string) {
  const key = process.env["FIRECRAWL_API_KEY"];
  if (!key) throw new Error("FIRECRAWL_NOT_CONFIGURED");

  const gatewayMode = key.startsWith("lovc_");
  const endpoint = gatewayMode
    ? "https://connector-gateway.lovable.dev/firecrawl/v2/scrape"
    : "https://api.firecrawl.dev/v2/scrape";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (gatewayMode) {
    headers["Authorization"] = `Bearer ${process.env["LOVABLE_API_KEY"]}`;
    headers["X-Connection-Api-Key"] = key;
  } else {
    headers["Authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      formats: [
        {
          type: "json",
          schema: OFFER_SCHEMA,
          prompt:
            "استخرج كل عروض المنتجات المعروضة في الصفحة: اسم المنتج (title)، العلامة التجارية (brand)، الحجم/الوحدة (unit)، السعر بعد الخصم (price) بالريال السعودي، السعر قبل الخصم (originalPrice)، رابط صورة المنتج (imageUrl)، ورابط صفحة المنتج (productUrl). تجاهل أي عنصر بدون سعر واضح.",
        },
      ],
    }),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`Firecrawl [${res.status}]: ${body.slice(0, 400)}`);

  const parsed = JSON.parse(body) as {
    json?: { offers?: unknown[] };
    data?: { json?: { offers?: unknown[] } };
  };
  return (parsed.json?.offers ?? parsed.data?.json?.offers ?? []) as Record<string, unknown>[];
}

function toOffer(raw: Record<string, unknown>, sourceId: string, index: number): CrawledOffer | null {
  const title = typeof raw["title"] === "string" ? raw["title"].trim() : "";
  const price = Number(raw["price"]);
  if (!title || !Number.isFinite(price) || price <= 0) return null;

  const originalRaw = Number(raw["originalPrice"]);
  const originalPrice = Number.isFinite(originalRaw) && originalRaw > price ? originalRaw : price;

  return {
    sourceKey: `${sourceId}:${title.slice(0, 80)}:${index}`,
    title,
    brand: typeof raw["brand"] === "string" ? raw["brand"] : null,
    unit: typeof raw["unit"] === "string" ? raw["unit"] : null,
    price,
    originalPrice,
    imageUrl: typeof raw["imageUrl"] === "string" ? raw["imageUrl"] : null,
    productUrl: typeof raw["productUrl"] === "string" ? raw["productUrl"] : null,
  };
}

export type CrawlResult = { source: CrawlSourceId; saved: number; error?: string };

/** يسحب مصدراً واحداً ويخزّن نتائجه في external_deals */
export async function crawlAndStore(source: SourceConfig): Promise<CrawlResult> {
  try {
    const raw = await firecrawlScrape(source.url);
    const offers = raw
      .map((r, i) => toOffer(r, source.id, i))
      .filter((o): o is CrawledOffer => o !== null)
      .slice(0, 40);

    if (offers.length === 0) return { source: source.id, saved: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = offers.map((o) => ({
      source: source.id,
      source_key: o.sourceKey,
      store_id: source.id,
      store_name: source.storeName,
      title: o.title,
      brand: o.brand,
      category: source.category,
      unit: o.unit,
      original_price: o.originalPrice,
      price: o.price,
      discount_percent:
        o.originalPrice > o.price ? Math.round(((o.originalPrice - o.price) / o.originalPrice) * 100) : 0,
      image_url: o.imageUrl,
      product_url: o.productUrl ?? source.url,
      active: true,
      fetched_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("external_deals")
      .upsert(rows, { onConflict: "source,source_key" });
    if (error) throw error;

    return { source: source.id, saved: rows.length };
  } catch (e) {
    return { source: source.id, saved: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

/** يسحب كل المصادر المسموح بها */
export async function crawlAllSources(only?: CrawlSourceId[]): Promise<CrawlResult[]> {
  if (!firecrawlConfigured()) {
    return CRAWL_SOURCES.filter((s) => !only || only.includes(s.id)).map((s) => ({
      source: s.id,
      saved: 0,
      error: "FIRECRAWL_NOT_CONFIGURED",
    }));
  }
  const targets = CRAWL_SOURCES.filter((s) => !only || only.includes(s.id));
  return Promise.all(targets.map(crawlAndStore));
}
