/**
 * بوتات التسويق: تختار أقوى عرض نشط وتنشره على المنصات (تويتر/إنستغرام/تيك توك/سناب)
 * أو ترسله كإشعار داخلي (store). المفاتيح تُقرأ من مخزن المفاتيح المشفّر.
 */
import { getIntegrationKey } from "@/lib/integration-keys.server";

export const MARKETING_PLATFORMS = [
  "store",
  "twitter",
  "instagram",
  "tiktok",
  "snapchat",
] as const;
export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number];

export function isMarketingPlatform(value: string): value is MarketingPlatform {
  return (MARKETING_PLATFORMS as readonly string[]).includes(value);
}

const SITE_URL = "https://alhkmy.store";
const TAG = "HKM11";

type Pick = {
  title: string;
  price: number | null;
  original: number | null;
  discount: number | null;
  image: string | null;
  url: string | null;
  store: string | null;
};

async function pickOffer(platform: MarketingPlatform): Promise<Pick | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: recent } = await supabaseAdmin
    .from("marketing_posts")
    .select("title")
    .eq("platform", platform)
    .order("created_at", { ascending: false })
    .limit(20);
  const seen = new Set((recent ?? []).map((r) => (r.title ?? "").trim()).filter(Boolean));

  const { data: deals } = await supabaseAdmin
    .from("external_deals")
    .select("title, price, original_price, discount_percent, image_url, product_url, store_name")
    .eq("active", true)
    .order("discount_percent", { ascending: false })
    .limit(40);

  const deal = (deals ?? []).find((d) => !seen.has((d.title ?? "").trim()));
  if (deal) {
    return {
      title: deal.title,
      price: deal.price,
      original: deal.original_price,
      discount: deal.discount_percent,
      image: deal.image_url,
      url: deal.product_url,
      store: deal.store_name,
    };
  }

  const { data: coupons } = await supabaseAdmin
    .from("coupons")
    .select("title, code, store_name, discount")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(20);
  const coupon = (coupons ?? []).find((c) => !seen.has((c.title ?? "").trim()));
  if (!coupon) return null;

  return {
    title: `${coupon.title} — كود ${coupon.code}`,
    price: null,
    original: null,
    discount: null,
    image: null,
    url: `${SITE_URL}/coupons`,
    store: coupon.store_name,
  };
}

function compose(pick: Pick): string {
  const lines: string[] = [];
  lines.push(`🔥 ${pick.title}`);
  if (pick.store) lines.push(`🏬 ${pick.store}`);
  if (pick.price != null) {
    lines.push(
      pick.original && pick.original > pick.price
        ? `💰 ${pick.price} ر.س بدل ${pick.original} ر.س${pick.discount ? ` (خصم ${pick.discount}%)` : ""}`
        : `💰 ${pick.price} ر.س`,
    );
  }
  lines.push(`🔗 ${pick.url ?? SITE_URL}`);
  lines.push(`#حكيم #عروض_السعودية #${TAG}`);
  return lines.join("\n");
}

/* ----------------------------- Twitter OAuth1 ----------------------------- */

function pct(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

async function hmacSha1(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message)));
  let binary = "";
  for (const b of sig) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function publishTwitter(text: string): Promise<{ id: string }> {
  const [apiKey, apiSecret, token, tokenSecret] = await Promise.all([
    getIntegrationKey("TWITTER_API_KEY"),
    getIntegrationKey("TWITTER_API_SECRET"),
    getIntegrationKey("TWITTER_ACCESS_TOKEN"),
    getIntegrationKey("TWITTER_ACCESS_SECRET"),
  ]);
  if (!apiKey || !apiSecret || !token || !tokenSecret) throw new Error("missing_keys");

  const url = "https://api.twitter.com/2/tweets";
  const params: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: "1.0",
  };
  const base = [
    "POST",
    pct(url),
    pct(
      Object.keys(params)
        .sort()
        .map((k) => `${pct(k)}=${pct(params[k]!)}`)
        .join("&"),
    ),
  ].join("&");
  const signature = await hmacSha1(`${pct(apiSecret)}&${pct(tokenSecret)}`, base);
  const header = `OAuth ${Object.entries({ ...params, oauth_signature: signature })
    .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
    .join(", ")}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: header, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 275) }),
  });
  const json = (await res.json()) as { data?: { id?: string }; detail?: string };
  if (!res.ok) throw new Error(json.detail ?? `twitter_${res.status}`);
  return { id: json.data?.id ?? "" };
}

async function publishInstagram(text: string, image: string | null): Promise<{ id: string }> {
  const [businessId, token] = await Promise.all([
    getIntegrationKey("INSTAGRAM_BUSINESS_ID"),
    getIntegrationKey("INSTAGRAM_ACCESS_TOKEN"),
  ]);
  if (!businessId || !token) throw new Error("missing_keys");
  if (!image) throw new Error("instagram_requires_image");

  const createRes = await fetch(`https://graph.facebook.com/v21.0/${businessId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: image, caption: text, access_token: token }),
  });
  const created = (await createRes.json()) as { id?: string; error?: { message?: string } };
  if (!createRes.ok || !created.id) throw new Error(created.error?.message ?? "instagram_create");

  const pubRes = await fetch(`https://graph.facebook.com/v21.0/${businessId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: created.id, access_token: token }),
  });
  const published = (await pubRes.json()) as { id?: string; error?: { message?: string } };
  if (!pubRes.ok) throw new Error(published.error?.message ?? "instagram_publish");
  return { id: published.id ?? created.id };
}

async function publishTiktok(text: string, url: string | null): Promise<{ id: string }> {
  const token = await getIntegrationKey("TIKTOK_ACCESS_TOKEN");
  if (!token) throw new Error("missing_keys");
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      post_info: { title: text.slice(0, 150), privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", video_url: url ?? SITE_URL },
    }),
  });
  const json = (await res.json()) as {
    data?: { publish_id?: string };
    error?: { message?: string; code?: string };
  };
  if (!res.ok || (json.error?.code && json.error.code !== "ok")) {
    throw new Error(json.error?.message ?? `tiktok_${res.status}`);
  }
  return { id: json.data?.publish_id ?? "" };
}

async function publishSnapchat(text: string, link: string | null): Promise<{ id: string }> {
  const [token, profileId] = await Promise.all([
    getIntegrationKey("SNAPCHAT_ACCESS_TOKEN"),
    getIntegrationKey("SNAPCHAT_PROFILE_ID"),
  ]);
  if (!token || !profileId) throw new Error("missing_keys");
  const res = await fetch(
    `https://businessapi.snapchat.com/v1/public_profiles/${profileId}/spotlight_posts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ description: text.slice(0, 200), web_view_url: link ?? SITE_URL }),
    },
  );
  const json = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) throw new Error(json.message ?? `snapchat_${res.status}`);
  return { id: json.id ?? "" };
}

async function publishStore(pick: Pick, text: string): Promise<{ id: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendPushBatch } = await import("@/lib/push.server");
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .limit(500);
  const list = (subs ?? []).map((s) => ({
    endpoint: s.endpoint,
    p256dh: s.p256dh,
    auth: s.auth,
  }));
  if (list.length === 0) return { id: "no_subscribers" };
  const result = await sendPushBatch(list, {
    title: "عرض حكيم اليوم",
    body: text.split("\n").slice(0, 2).join(" — "),
    url: pick.url ?? SITE_URL,
    ...(pick.image ? { image: pick.image } : {}),
    tag: "marketing",
  });
  return { id: `push_${result.sent}` };
}

export type MarketingRunResult = {
  platform: MarketingPlatform;
  status: "published" | "pending" | "failed" | "skipped";
  message: string;
};

export async function runMarketingBot(platform: MarketingPlatform): Promise<MarketingRunResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const pick = await pickOffer(platform);
  if (!pick) return { platform, status: "skipped", message: "لا توجد عروض جديدة للنشر." };

  const text = compose(pick);
  let status: MarketingRunResult["status"] = "published";
  let message = "تم النشر";
  let externalId: string | null = null;
  let error: string | null = null;

  try {
    const res =
      platform === "twitter"
        ? await publishTwitter(text)
        : platform === "instagram"
          ? await publishInstagram(text, pick.image)
          : platform === "tiktok"
            ? await publishTiktok(text, pick.url)
            : platform === "snapchat"
              ? await publishSnapchat(text, pick.url)
              : await publishStore(pick, text);
    externalId = res.id || null;
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    if (reason === "missing_keys") {
      status = "pending";
      message = "بانتظار إضافة مفاتيح النشر لهذه المنصة.";
    } else {
      status = "failed";
      message = reason;
      error = reason;
    }
  }

  await supabaseAdmin.from("marketing_posts").insert({
    platform,
    title: pick.title,
    content: text,
    image_url: pick.image,
    link_url: pick.url,
    status,
    external_id: externalId,
    error,
    published_at: status === "published" ? new Date().toISOString() : null,
  });

  const key = platform === "store" ? "store_marketing" : platform;
  const { data: bot } = await supabaseAdmin
    .from("marketing_bots")
    .select("posts_count")
    .eq("key", key)
    .maybeSingle();
  await supabaseAdmin
    .from("marketing_bots")
    .update({
      last_run_at: new Date().toISOString(),
      last_status: status,
      posts_count: (bot?.posts_count ?? 0) + (status === "published" ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  return { platform, status, message };
}

/** تشغيل كل البوتات المفعّلة (لجدولة cron). */
export async function runAllMarketingBots(): Promise<MarketingRunResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("marketing_bots")
    .select("key, platform, enabled")
    .eq("enabled", true);
  const out: MarketingRunResult[] = [];
  for (const bot of data ?? []) {
    if (isMarketingPlatform(bot.platform)) out.push(await runMarketingBot(bot.platform));
  }
  return out;
}
