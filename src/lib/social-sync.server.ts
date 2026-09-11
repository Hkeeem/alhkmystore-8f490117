/**
 * مزامنة تلقائية لعروض السوشال ميديا من الحسابات الشخصية.
 * كل حساب يُسجَّل بمنصته واسمه ورابط تغذية عام (RSS/Atom/JSON) — مثل تغذية
 * قناة تيليجرام أو مدونة أو مُصدِّر منشورات — ثم تُخزَّن العروض في social_offers
 * مع تاريخ انتهاء وإحداثيات لعرضها على الخريطة.
 * server-only — لا يُستورد من كود المتصفح.
 */

import { recordSyncEvent } from "./external-sync.server";

export type SocialAccount = {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  feed_url: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  active: boolean;
};

export type SocialSyncResult = {
  accounts: number;
  upserted: number;
  expired: number;
  errors: Array<{ account: string; message: string }>;
};

const MAX_ITEMS = 40;
/** مدة صلاحية افتراضية للعرض إذا لم يذكر المنشور تاريخ انتهاء */
const DEFAULT_TTL_DAYS = 7;

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
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

function hashKey(input: string) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function toPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = String(raw)
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** يستخرج السعر/السعر قبل الخصم/الكود/تاريخ الانتهاء من نص المنشور */
export function extractOfferFacts(text: string) {
  const prices = Array.from(text.matchAll(/(\d[\d.,]*)\s*(?:ر\.?س|ريال|SAR|sar)/g))
    .map((m) => toPrice(m[1]))
    .filter((v): v is number => v !== null);

  const price = prices.length ? Math.min(...prices) : null;
  const originalPrice = prices.length > 1 ? Math.max(...prices) : null;

  const percentMatch = text.match(
    /(?:خصم|discount|off)\D{0,8}(\d{1,2})\s*%|(\d{1,2})\s*%\s*(?:خصم|off)/i,
  );
  const discountPercent = percentMatch ? Number(percentMatch[1] ?? percentMatch[2]) : null;

  const codeMatch = text.match(/(?:كود|الكود|كوبون|code|coupon)\s*[:：-]?\s*([A-Za-z0-9]{3,20})/i);
  const couponCode = codeMatch?.[1]?.toUpperCase() ?? null;

  // "ينتهي 2026-09-20" أو "حتى 20/09/2026"
  const dateMatch = text.match(
    /(?:ينتهي|حتى|until|ends)\D{0,10}(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
  );
  let expiresAt: string | null = null;
  if (dateMatch?.[1]) {
    const raw =
      dateMatch[1].includes("-") && dateMatch[1].length === 10
        ? dateMatch[1]
        : dateMatch[1].replace(/[/-]/g, "/").split("/").reverse().join("-");
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) expiresAt = parsed.toISOString();
  }
  // "لمدة 3 أيام" / "آخر يوم"
  if (!expiresAt) {
    const days = text.match(/لمدة\s*(\d{1,2})\s*(?:يوم|أيام)/);
    if (days?.[1]) expiresAt = new Date(Date.now() + Number(days[1]) * 86400000).toISOString();
    else if (/آخر يوم|اليوم فقط|last day/i.test(text)) {
      expiresAt = new Date(Date.now() + 86400000).toISOString();
    }
  }

  return { price, originalPrice, discountPercent, couponCode, expiresAt };
}

type RawPost = {
  title: string | null;
  body: string | null;
  link: string | null;
  image: string | null;
  id: string | null;
  date: string | null;
};

function parseXmlPosts(body: string): RawPost[] {
  const blocks = body.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/gi) ?? [];
  return blocks.slice(0, MAX_ITEMS).map((block) => {
    const imgMatch =
      block.match(/<media:content[^>]*url=["']([^"']+)["']/i) ??
      block.match(/<enclosure[^>]*url=["']([^"']+)["']/i) ??
      block.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
    return {
      title: tag(block, ["title"]),
      body: tag(block, ["description", "content:encoded", "content", "summary"]),
      link: tag(block, ["link", "guid"]),
      image: imgMatch?.[1] ?? null,
      id: tag(block, ["guid", "id"]),
      date: tag(block, ["pubDate", "updated", "published"]),
    };
  });
}

function parseJsonPosts(body: string): RawPost[] {
  const parsed: unknown = JSON.parse(body);
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown[] })?.items)
      ? (parsed as { items: unknown[] }).items
      : Array.isArray((parsed as { data?: unknown[] })?.data)
        ? (parsed as { data: unknown[] }).data
        : Array.isArray((parsed as { posts?: unknown[] })?.posts)
          ? (parsed as { posts: unknown[] }).posts
          : [];

  return list.slice(0, MAX_ITEMS).map((entry) => {
    const item = entry as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = item[key];
        if (typeof value === "string" || typeof value === "number") return String(value);
      }
      return null;
    };
    return {
      title: pick("title", "caption", "text", "content"),
      body: pick("content_html", "content", "caption", "text", "description"),
      link: pick("url", "link", "permalink", "post_url"),
      image: pick("image", "image_url", "thumbnail_url", "media_url", "display_url"),
      id: pick("id", "shortcode", "post_id"),
      date: pick("date_published", "timestamp", "created_time", "taken_at"),
    };
  });
}

export async function fetchAccountPosts(account: SocialAccount): Promise<RawPost[]> {
  if (!account.feed_url) throw new Error("لا يوجد رابط تغذية لهذا الحساب");
  const response = await fetch(account.feed_url, {
    headers: {
      "User-Agent": "HkeeemAI-SocialBot/1.0",
      Accept: "application/rss+xml, application/xml, application/json;q=0.9, */*;q=0.5",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.text();
  const trimmed = body.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[")
    ? parseJsonPosts(body)
    : parseXmlPosts(body);
}

/** يشغّل المزامنة على كل الحسابات المفعّلة ويحدّث social_offers */
export async function runSocialSync(accountId?: string): Promise<SocialSyncResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let query = supabaseAdmin.from("social_accounts").select("*").eq("active", true);
  if (accountId) query = query.eq("id", accountId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const accounts = (data ?? []) as SocialAccount[];
  const result: SocialSyncResult = {
    accounts: accounts.length,
    upserted: 0,
    expired: 0,
    errors: [],
  };

  const now = new Date().toISOString();

  for (const account of accounts) {
    try {
      const posts = await fetchAccountPosts(account);
      const rows = posts
        .map((post) => {
          const text = [post.title, post.body].filter(Boolean).join(" • ");
          if (!text) return null;
          const facts = extractOfferFacts(text);
          const title = (post.title ?? text).slice(0, 200);
          const key = (post.id ?? hashKey(post.link ?? title)).slice(0, 160);
          return {
            account_id: account.id,
            platform: account.platform,
            handle: account.handle,
            source_key: key,
            title,
            description: post.body ? post.body.slice(0, 600) : null,
            image_url: post.image,
            post_url: post.link,
            coupon_code: facts.couponCode,
            original_price: facts.originalPrice,
            price: facts.price,
            discount_percent:
              facts.discountPercent ??
              (facts.price && facts.originalPrice && facts.originalPrice > facts.price
                ? Math.round(((facts.originalPrice - facts.price) / facts.originalPrice) * 100)
                : null),
            city: account.city,
            lat: account.lat,
            lng: account.lng,
            expires_at:
              facts.expiresAt ?? new Date(Date.now() + DEFAULT_TTL_DAYS * 86400000).toISOString(),
            active: true,
            fetched_at: now,
          };
        })
        .filter(Boolean) as Record<string, unknown>[];

      if (rows.length === 0) throw new Error("لم تُرجع التغذية أي منشورات صالحة");

      const { error: upsertError } = await supabaseAdmin
        .from("social_offers")
        .upsert(rows as never, { onConflict: "platform,source_key" });
      if (upsertError) throw new Error(upsertError.message);

      result.upserted += rows.length;

      await supabaseAdmin
        .from("social_accounts")
        .update({ last_run_at: now, last_status: "success", last_count: rows.length })
        .eq("id", account.id);
      await recordSyncEvent({
        source: `social:${account.platform}:${account.handle}`,
        status: "success",
        message: `${rows.length} منشور عرض`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ account: `${account.platform}/${account.handle}`, message });
      await supabaseAdmin
        .from("social_accounts")
        .update({ last_run_at: now, last_status: `failure: ${message.slice(0, 120)}` })
        .eq("id", account.id);
      await recordSyncEvent({
        source: `social:${account.platform}:${account.handle}`,
        status: "failure",
        code: "http_error",
        message,
      });
    }
  }

  // إخفاء العروض المنتهية (لا تُحذف حتى يبقى سجلها)
  const { data: expired } = await supabaseAdmin
    .from("social_offers")
    .update({ active: false })
    .eq("active", true)
    .lt("expires_at", now)
    .select("id");
  result.expired = expired?.length ?? 0;

  return result;
}
