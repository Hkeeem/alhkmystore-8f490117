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

/* --------------------------- سجل أحداث التحديث --------------------------- */

export type SyncFailureCode =
  | "missing_keys"
  | "auth_error"
  | "partner_tag_invalid"
  | "throttled"
  | "http_error"
  | "network_error"
  | "upsert_failed"
  | "empty_result";

export async function recordSyncEvent(entry: {
  source: string;
  status: "success" | "failure";
  code?: string;
  message?: string;
  keyword?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sync_events").insert({
      source: entry.source,
      status: entry.status,
      code: entry.code ?? null,
      message: entry.message ? entry.message.slice(0, 500) : null,
      keyword: entry.keyword ?? null,
    });
    if (entry.status === "failure") {
      const { maybeAlertSyncFailure } = await import("@/lib/sync-alerts.server");
      await maybeAlertSyncFailure({
        source: entry.source,
        ...(entry.code ? { code: entry.code } : {}),
        ...(entry.message ? { message: entry.message } : {}),
        ...(entry.keyword ? { keyword: entry.keyword } : {}),
      });
    }
  } catch (error) {
    console.error("recordSyncEvent failed", error);
  }
}


function amazonHttpCode(status: number, body: string): SyncFailureCode {
  if (status === 429) return "throttled";
  if (status === 401 || status === 403 || /Signature|UnrecognizedClient|InvalidSignature/i.test(body)) return "auth_error";
  if (/PartnerTag|InvalidPartnerTag|AssociateValidation/i.test(body)) return "partner_tag_invalid";
  return "http_error";
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
  try {
    return await amazonSearch(keyword);
  } catch (error) {
    console.error("Amazon PA-API threw", error);
    await recordSyncEvent({
      source: "amazon",
      status: "failure",
      code: "network_error",
      message: error instanceof Error ? error.message : "تعذّر الاتصال بخوادم أمازون",
      keyword,
    });
    return [];
  }
}

async function amazonSearch(keyword: string): Promise<ExternalOffer[]> {
  const { getIntegrationKey } = await import("@/lib/integration-keys.server");
  const accessKey = await getIntegrationKey("AMAZON_ACCESS_KEY");
  const secretKey = await getIntegrationKey("AMAZON_SECRET_KEY");
  const partnerTag = await getIntegrationKey("AMAZON_PARTNER_TAG");
  if (!accessKey || !secretKey || !partnerTag) {
    const missing = [
      !accessKey && "AMAZON_ACCESS_KEY",
      !secretKey && "AMAZON_SECRET_KEY",
      !partnerTag && "AMAZON_PARTNER_TAG",
    ].filter(Boolean).join(" · ");
    await recordSyncEvent({ source: "amazon", status: "failure", code: "missing_keys", message: `مفاتيح ناقصة: ${missing}`, keyword });
    return [];
  }

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
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Amazon PA-API failed [${response.status}]`);
    await recordSyncEvent({
      source: "amazon",
      status: "failure",
      code: amazonHttpCode(response.status, body),
      message: `استجابة أمازون ${response.status}`,
      keyword,
    });
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
  const { getIntegrationKey } = await import("@/lib/integration-keys.server");
  const affiliateId = await getIntegrationKey("NOON_AFFILIATE_ID");
  if (!affiliateId) {
    await recordSyncEvent({
      source: "noon",
      status: "failure",
      code: "missing_keys",
      message: "مفاتيح ناقصة: NOON_AFFILIATE_ID",
      keyword,
    });
  }
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
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      console.error(`noon catalog failed [${response.status}]`);
      await recordSyncEvent({
        source: "noon",
        status: "failure",
        code: response.status === 429 ? "throttled" : "http_error",
        message: `استجابة نون ${response.status}`,
        keyword,
      });
      return [];
    }
    json = (await response.json()) as { hits?: NoonHit[]; products?: NoonHit[] };
  } catch (error) {
    console.error("noon catalog threw", error);
    await recordSyncEvent({
      source: "noon",
      status: "failure",
      code: "network_error",
      message: error instanceof Error ? error.message : "تعذّر الاتصال بكتالوج نون",
      keyword,
    });
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

export type SyncSource = "amazon" | "noon" | "all";

export async function syncExternalDeals(
  keywords: string[] = DEFAULT_KEYWORDS,
  source: SyncSource = "all",
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const targets: Array<"amazon" | "noon"> = source === "all" ? ["amazon", "noon"] : [source];

  const batches = await Promise.all(
    keywords.flatMap((keyword) =>
      targets.map((t) => (t === "amazon" ? fetchAmazonOffers(keyword) : fetchNoonOffers(keyword))),
    ),
  );

  const byKey = new Map<string, ExternalOffer>();
  for (const offer of batches.flat()) {
    byKey.set(`${offer.source}:${offer.source_key}`, offer);
  }
  const offers = [...byKey.values()];

  if (offers.length === 0) {
    for (const t of targets) {
      await recordSyncEvent({ source: t, status: "failure", code: "empty_result", message: "لم تُرجع الدورة أي عروض" });
    }
    return { upserted: 0, deactivated: 0, sources: { amazon: 0, noon: 0 } };
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("external_deals")
    .upsert(
      offers.map((offer) => ({ ...offer, fetched_at: now })),
      { onConflict: "source,source_key" },
    );
  if (error) {
    for (const t of targets) {
      await recordSyncEvent({ source: t, status: "failure", code: "upsert_failed", message: error.message });
    }
    throw new Error(`upsert failed: ${error.message}`);
  }

  // أي عرض لم يعد يظهر في المصدر منذ 24 ساعة يُعطّل تلقائياً
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabaseAdmin
    .from("external_deals")
    .update({ active: false })
    .in("source", targets)
    .eq("active", true)
    .lt("fetched_at", cutoff)
    .select("id");

  const amazonCount = offers.filter((o) => o.source === "amazon").length;
  const noonCount = offers.filter((o) => o.source === "noon").length;
  if (amazonCount > 0) await recordSyncEvent({ source: "amazon", status: "success", message: `${amazonCount} عرضًا` });
  if (noonCount > 0) await recordSyncEvent({ source: "noon", status: "success", message: `${noonCount} عرضًا` });

  return {
    upserted: offers.length,
    deactivated: stale?.length ?? 0,
    sources: { amazon: amazonCount, noon: noonCount },
  };
}


/** اختبار مباشر لمفاتيح Amazon PA-API — يُرجع نتيجة مفهومة دون كشف أي قيمة */
export type AmazonTestResult = {
  ok: boolean;
  code: string;
  message: string;
  items?: number;
};

export async function testAmazonCredentials(): Promise<AmazonTestResult> {
  const { getIntegrationKey } = await import("@/lib/integration-keys.server");
  const accessKey = await getIntegrationKey("AMAZON_ACCESS_KEY");
  const secretKey = await getIntegrationKey("AMAZON_SECRET_KEY");
  const partnerTag = await getIntegrationKey("AMAZON_PARTNER_TAG");

  const missing = [
    !accessKey && "Access Key",
    !secretKey && "Secret Key",
    !partnerTag && "Partner Tag",
  ].filter(Boolean) as string[];
  if (missing.length > 0) {
    return { ok: false, code: "missing_keys", message: `مفاتيح ناقصة: ${missing.join(" · ")}` };
  }

  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
  const path = "/paapi5/searchitems";
  const payload = JSON.stringify({
    Keywords: "laptop",
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.sa",
    ItemCount: 1,
    Resources: ["ItemInfo.Title"],
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

  let response: Response;
  try {
    response = await fetch(`https://${AMAZON_HOST}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-encoding": "amz-1.0",
        "x-amz-date": amzDate,
        "x-amz-target": target,
        Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      body: payload,
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    console.error("amazon test request failed", error);
    return { ok: false, code: "network", message: "تعذّر الوصول إلى خوادم أمازون (انتهت المهلة أو خطأ شبكة)." };
  }

  if (response.ok) {
    const json = (await response.json()) as { SearchResult?: { Items?: unknown[] } };
    const items = json.SearchResult?.Items?.length ?? 0;
    return { ok: true, code: "ok", items, message: `الاتصال ناجح — أمازون ردّت بـ ${items} نتيجة تجريبية.` };
  }

  const text = (await response.text()).slice(0, 400);
  let code = `http_${response.status}`;
  let message = `فشل الاتصال (رمز ${response.status}).`;
  if (/InvalidSignature|SignatureDoesNotMatch/i.test(text)) {
    code = "invalid_signature";
    message = "التوقيع غير صحيح — تأكد من Access Key و Secret Key.";
  } else if (/InvalidPartnerTag|InvalidAssociate/i.test(text)) {
    code = "invalid_partner_tag";
    message = "Partner Tag غير صالح لسوق amazon.sa.";
  } else if (response.status === 429 || /TooManyRequests|Throttl/i.test(text)) {
    code = "throttled";
    message = "المفاتيح تعمل لكن تم تجاوز حد الطلبات مؤقتًا — أعد المحاولة بعد دقيقة.";
  } else if (/AccessDenied|not.*eligible|Unauthorized/i.test(text)) {
    code = "not_eligible";
    message = "الحساب غير مؤهّل لـ PA-API بعد — يلزم تحقيق ٣ مبيعات مؤهلة أولًا.";
  }
  console.error(`amazon test failed [${response.status}]: ${text}`);
  return { ok: false, code, message };
}
