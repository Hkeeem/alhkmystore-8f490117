/**
 * بوت جلب العروض من المتاجر الإلكترونية الأخرى.
 * يقرأ تغذيات المنتجات العامة (Google Merchant RSS / Atom / JSON) المسجّلة في
 * جدول store_feeds ثم يخزّن العروض في external_deals لتظهر مع عروض التجّار.
 * server-only — لا يُستورد من كود المتصفح.
 */

import { recordSyncEvent, type ExternalOffer } from "./external-sync.server";

type BotOffer = Omit<ExternalOffer, "source"> & { source: string };

export type StoreFeed = {
  id: string;
  store_name: string;
  feed_url: string;
  feed_type: string;
  category: string;
  affiliate_param: string | null;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_count: number;
};

export type StoreBotResult = {
  feeds: number;
  upserted: number;
  deactivated: number;
  errors: Array<{ store: string; message: string }>;
};

const MAX_ITEMS_PER_FEED = 60;

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(block: string, names: string[]): string | null {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
    if (match?.[1]) {
      const value = decodeEntities(match[1]);
      if (value) return value;
    }
    const selfClosing = block.match(new RegExp(`<${name}[^>]*href=["']([^"']+)["']`, "i"));
    if (selfClosing?.[1]) return decodeEntities(selfClosing[1]);
  }
  return null;
}

/** "1,299.00 SAR" → 1299 */
function toPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = String(raw)
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function withAffiliate(url: string, affiliateParam: string | null): string {
  if (!affiliateParam) return url;
  try {
    const target = new URL(url);
    for (const pair of affiliateParam.replace(/^[?&]/, "").split("&")) {
      const [key, ...rest] = pair.split("=");
      if (key) target.searchParams.set(key, rest.join("="));
    }
    return target.toString();
  } catch {
    return url;
  }
}

function hashKey(input: string) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

type RawItem = {
  title?: string | null;
  link?: string | null;
  image?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  brand?: string | null;
  id?: string | null;
};

function parseXmlFeed(body: string): RawItem[] {
  const blocks = body.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/gi) ?? [];
  return blocks.slice(0, MAX_ITEMS_PER_FEED).map((block) => {
    const sale = toPrice(tag(block, ["g:sale_price", "sale_price"]));
    const list = toPrice(tag(block, ["g:price", "price"]));
    return {
      title: tag(block, ["g:title", "title"]),
      link: tag(block, ["g:link", "link"]),
      image: tag(block, ["g:image_link", "image_link", "enclosure"]),
      brand: tag(block, ["g:brand", "brand"]),
      id: tag(block, ["g:id", "guid", "id"]),
      price: sale ?? list,
      originalPrice: sale ? list : null,
    };
  });
}

function parseJsonFeed(body: string): RawItem[] {
  const parsed: unknown = JSON.parse(body);
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { products?: unknown[] })?.products)
      ? (parsed as { products: unknown[] }).products
      : Array.isArray((parsed as { items?: unknown[] })?.items)
        ? (parsed as { items: unknown[] }).items
        : [];

  return list.slice(0, MAX_ITEMS_PER_FEED).map((entry) => {
    const item = entry as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = item[key];
        if (typeof value === "string" || typeof value === "number") return String(value);
      }
      return null;
    };
    const sale = toPrice(pick("sale_price", "salePrice", "discounted_price", "price"));
    const list2 = toPrice(
      pick("original_price", "originalPrice", "compare_at_price", "list_price", "was_price"),
    );
    return {
      title: pick("title", "name", "product_name"),
      link: pick("link", "url", "product_url"),
      image: pick("image", "image_link", "image_url", "thumbnail"),
      brand: pick("brand", "vendor"),
      id: pick("id", "sku", "product_id"),
      price: sale,
      originalPrice: list2,
    };
  });
}

export async function fetchStoreFeedOffers(feed: StoreFeed): Promise<BotOffer[]> {
  const response = await fetch(feed.feed_url, {
    headers: {
      "User-Agent": "HkeeemAI-DealBot/1.0",
      Accept: "application/rss+xml, application/xml, application/json;q=0.9, */*;q=0.5",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.text();

  const looksJson =
    feed.feed_type === "json" || (feed.feed_type === "auto" && body.trimStart().startsWith("["));
  const items =
    looksJson || body.trimStart().startsWith("{") ? parseJsonFeed(body) : parseXmlFeed(body);

  const offers: BotOffer[] = [];
  for (const item of items) {
    const title = item.title?.slice(0, 200);
    const link = item.link ?? null;
    const price = item.price ?? null;
    if (!title || !link || !price) continue;

    const original = item.originalPrice && item.originalPrice > price ? item.originalPrice : price;
    const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
    const key = item.id ? String(item.id) : hashKey(link);

    offers.push({
      source: `store:${feed.store_name}`,
      source_key: key.slice(0, 120),
      store_id: feed.id,
      store_name: feed.store_name,
      title,
      brand: item.brand ?? null,
      category: feed.category,
      original_price: original,
      price,
      discount_percent: discount,
      image_url: item.image ?? null,
      product_url: withAffiliate(link, feed.affiliate_param),
      product_key: null,
      active: true,
    });
  }
  return offers;
}

/** يشغّل البوت على كل التغذيات المفعّلة ويحدّث العروض في قاعدة البيانات */
export async function runStoreBot(feedId?: string): Promise<StoreBotResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let query = supabaseAdmin.from("store_feeds").select("*").eq("active", true);
  if (feedId) query = query.eq("id", feedId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const feeds = (data ?? []) as StoreFeed[];
  const result: StoreBotResult = { feeds: feeds.length, upserted: 0, deactivated: 0, errors: [] };
  if (feeds.length === 0) return result;

  const now = new Date().toISOString();

  for (const feed of feeds) {
    try {
      const offers = await fetchStoreFeedOffers(feed);
      if (offers.length === 0) throw new Error("لم تُرجع التغذية أي منتجات صالحة");

      const { error: upsertError } = await supabaseAdmin.from("external_deals").upsert(
        offers.map((offer) => ({ ...offer, fetched_at: now })),
        { onConflict: "source,source_key" },
      );
      if (upsertError) throw new Error(upsertError.message);

      // تعطيل عروض هذا المتجر التي لم تعد موجودة في التغذية
      const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: stale } = await supabaseAdmin
        .from("external_deals")
        .update({ active: false })
        .eq("source", `store:${feed.store_name}`)
        .eq("active", true)
        .lt("fetched_at", cutoff)
        .select("id");

      result.upserted += offers.length;
      result.deactivated += stale?.length ?? 0;

      await supabaseAdmin
        .from("store_feeds")
        .update({
          last_run_at: now,
          last_status: "success",
          last_count: offers.length,
          updated_at: now,
        })
        .eq("id", feed.id);
      await recordSyncEvent({
        source: `store:${feed.store_name}`,
        status: "success",
        message: `${offers.length} عرضًا`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ store: feed.store_name, message });
      await supabaseAdmin
        .from("store_feeds")
        .update({
          last_run_at: now,
          last_status: `failure: ${message.slice(0, 120)}`,
          updated_at: now,
        })
        .eq("id", feed.id);
      await recordSyncEvent({
        source: `store:${feed.store_name}`,
        status: "failure",
        code: "http_error",
        message,
      });
    }
  }

  return result;
}
