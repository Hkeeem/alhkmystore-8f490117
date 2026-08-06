/**
 * سحب العروض والأسعار والتوفر من Amazon.sa و noon.com ثم تحديثها في قاعدة البيانات.
 * server-only — لا يُستورد أبداً من كود المتصفح.
 */

export type ExternalOffer = {
  source: "amazon" | "noon";
  source_key: string;
  store_id: string;
  store_name: string;
  title: string;
  brand: string | null;
  category: string;
  original_price: number;
  price: number;
  discount_percent: number;
  image_url: string | null;
  product_url: string | null;
  product_key: string | null;
  active: boolean;
};

const AMAZON_HOST = "webservices.amazon.sa";
const AMAZON_REGION = "eu-west-1";

/** كلمات البحث الافتراضية التي تُسحب دورياً */
export const DEFAULT_KEYWORDS = [
  "لابتوب",
  "جوال",
  "سماعات",
  "شاشة تلفزيون",
  "مكيف",
  "عطور",
];

function pct(original: number, price: number) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

/* ------------------------------- Amazon ------------------------------- */

async function hmac(key: ArrayBuffer | Uint8Array, data: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function sha256Hex(data: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Amazon Product Advertising API v5 — SearchItems */
export async function fetchAmazonOffers(keyword: string): Promise<ExternalOffer[]> {
  const accessKey = process.env["AMAZON_ACCESS_KEY"];
  const secretKey = process.env["AMAZON_SECRET_KEY"];
  const partnerTag = process.env["AMAZON_PARTNER_TAG"];
  if (!accessKey || !secretKey || !partnerTag) return [];

  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
  const path = "/paapi5/searchitems";
  const payload = JSON.stringify({
    Keywords: keyword,
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.sa",
    ItemCount: 10,
    Resources: [
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.Availability.Message",
    ],
  });

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `host:${AMAZON_HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;host;x-amz-date;x-amz-target";
  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${await sha256Hex(payload)}`;
  const scope = `${dateStamp}/${AMAZON_REGION}/ProductAdvertisingAPI/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonicalRequest)}`;

  let signingKey: ArrayBuffer | Uint8Array = new TextEncoder().encode(`AWS4${secretKey}`);
  for (const part of [dateStamp, AMAZON_REGION, "ProductAdvertisingAPI", "aws4_request"]) {
    signingKey = await hmac(signingKey, part);
  }
  const signature = toHex(await hmac(signingKey, stringToSign));

  const response = await fetch(`https://${AMAZON_HOST}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-encoding": "amz-1.0",
      "x-amz-date": amzDate,
      "x-amz-target": target,
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: payload,
  });

  if (!response.ok) {
    console.error(`Amazon PA-API failed [${response.status}]: ${await response.text()}`);
    return [];
  }

  const json = (await response.json()) as {
    SearchResult?: {
      Items?: Array<{
        ASIN: string;
        DetailPageURL?: string;
        Images?: { Primary?: { Medium?: { URL?: string } } };
        ItemInfo?: {
          Title?: { DisplayValue?: string };
          ByLineInfo?: { Brand?: { DisplayValue?: string } };
        };
        Offers?: {
          Listings?: Array<{
            Price?: { Amount?: number };
            SavingBasis?: { Amount?: number };
            Availability?: { Message?: string };
          }>;
        };
      }>;
    };
  };

  const offers: ExternalOffer[] = [];
  for (const item of json.SearchResult?.Items ?? []) {
    const listing = item.Offers?.Listings?.[0];
    const price = listing?.Price?.Amount;
    if (!price) continue;
    const original = listing?.SavingBasis?.Amount ?? price;
    const availability = listing?.Availability?.Message ?? "";
    offers.push({
      source: "amazon",
      source_key: item.ASIN,
      store_id: "amazon",
      store_name: "أمازون السعودية",
      title: item.ItemInfo?.Title?.DisplayValue ?? "منتج",
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? null,
      category: "إلكترونيات",
      original_price: original,
      price,
      discount_percent: pct(original, price),
      image_url: item.Images?.Primary?.Medium?.URL ?? null,
      product_url: item.DetailPageURL ?? `https://www.amazon.sa/dp/${item.ASIN}`,
      product_key: `amazon:${item.ASIN}`,
      active: !/غير متوفر|unavailable|out of stock/i.test(availability),
    });
  }
  return offers;
}

/* -------------------------------- noon -------------------------------- */

type NoonHit = {
  sku?: string;
  name?: string;
  brand?: string;
  price?: number;
  sale_price?: number;
  image_key?: string;
  url?: string;
  is_buyable?: boolean;
};

/** noon.com — كتالوج البحث العام */
export async function fetchNoonOffers(keyword: string): Promise<ExternalOffer[]> {
  const affiliateId = process.env["NOON_AFFILIATE_ID"];
  const url = `https://www.noon.com/_svc/catalog/api/v3/u/search?q=${encodeURIComponent(keyword)}&limit=20`;

  let json: { hits?: NoonHit[]; products?: NoonHit[] };
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-locale": "ar-sa",
        "x-content-type": "application/json",
        "user-agent": "Mozilla/5.0 (compatible; HkeeemAI/1.0; +https://alhkmystore.lovable.app)",
      },
    });
    if (!response.ok) {
      console.error(`noon catalog failed [${response.status}]`);
      return [];
    }
    json = (await response.json()) as { hits?: NoonHit[]; products?: NoonHit[] };
  } catch (error) {
    console.error("noon catalog threw", error);
    return [];
  }

  const hits = json.hits ?? json.products ?? [];
  const offers: ExternalOffer[] = [];
  for (const hit of hits) {
    const sku = hit.sku;
    const price = hit.sale_price ?? hit.price;
    if (!sku || !price) continue;
    const original = hit.price && hit.price > price ? hit.price : price;
    const productUrl = hit.url
      ? `https://www.noon.com/saudi-ar/${hit.url}`
      : `https://www.noon.com/saudi-ar/p/?sku=${sku}`;
    offers.push({
      source: "noon",
      source_key: sku,
      store_id: "noon",
      store_name: "نون",
      title: hit.name ?? "منتج",
      brand: hit.brand ?? null,
      category: "إلكترونيات",
      original_price: original,
      price,
      discount_percent: pct(original, price),
      image_url: hit.image_key ? `https://f.nooncdn.com/p/${hit.image_key}.jpg` : null,
      product_url: affiliateId ? `${productUrl}?utm_source=${affiliateId}` : productUrl,
      product_key: `noon:${sku}`,
      active: hit.is_buyable !== false,
    });
  }
  return offers;
}

/* ------------------------------ التزامن ------------------------------- */

export async function syncExternalDeals(keywords: string[] = DEFAULT_KEYWORDS) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const batches = await Promise.all(
    keywords.flatMap((keyword) => [fetchAmazonOffers(keyword), fetchNoonOffers(keyword)]),
  );

  const byKey = new Map<string, ExternalOffer>();
  for (const offer of batches.flat()) {
    byKey.set(`${offer.source}:${offer.source_key}`, offer);
  }
  const offers = [...byKey.values()];

  if (offers.length === 0) {
    return { upserted: 0, deactivated: 0, sources: { amazon: 0, noon: 0 } };
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("external_deals")
    .upsert(
      offers.map((offer) => ({ ...offer, fetched_at: now })),
      { onConflict: "source,source_key" },
    );
  if (error) throw new Error(`upsert failed: ${error.message}`);

  // أي عرض لم يعد يظهر في المصدر منذ 24 ساعة يُعطّل تلقائياً
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabaseAdmin
    .from("external_deals")
    .update({ active: false })
    .in("source", ["amazon", "noon"])
    .eq("active", true)
    .lt("fetched_at", cutoff)
    .select("id");

  return {
    upserted: offers.length,
    deactivated: stale?.length ?? 0,
    sources: {
      amazon: offers.filter((o) => o.source === "amazon").length,
      noon: offers.filter((o) => o.source === "noon").length,
    },
  };
}
