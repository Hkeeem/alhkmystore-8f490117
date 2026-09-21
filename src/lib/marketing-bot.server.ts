import { getIntegrationKey } from "@/lib/integration-keys.server";

const SITE_URL = "https://alkmystore-placeholder.lovable.app";

type BotRow = {
  key: string;
  label: string;
  platform: string;
  enabled: boolean;
  posts_count: number;
};

type PublishResult = { ok: boolean; error?: string; externalId?: string };

export type MarketingBotRunResult = {
  ran: Array<{ bot: string; platform: string; ok: boolean; error?: string }>;
  skipped: string[];
};

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadBots(platform?: string): Promise<BotRow[]> {
  const db = await getAdmin();
  let query = db
    .from("marketing_bots")
    .select("key,label,platform,enabled,posts_count")
    .eq("enabled", true);
  if (platform) query = query.eq("platform", platform);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as BotRow[];
}

type Content = {
  title: string;
  text: string;
  link: string;
  imageUrl: string | null;
};

/** يختار أفضل عرض/كوبون نشط ويصيغ نص المنشور بلهجة سعودية. */
async function pickContent(): Promise<Content> {
  const db = await getAdmin();
  const { data: deals } = await db
    .from("merchant_deals")
    .select("id,title,price,original_price,image_url,coupon_code")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  const deal = (deals ?? []).find((d) => d.price && d.original_price && d.original_price > d.price);

  if (deal) {
    const discount = Math.round((1 - deal.price / deal.original_price) * 100);
    const text =
      `🔥 عرض اليوم من حكيم AI: ${deal.title} بس ${deal.price} ر.س بدل ${deal.original_price} ر.س` +
      (discount > 0 ? ` — وفّر ${discount}%!` : "") +
      (deal.coupon_code ? `\n🎟️ كود الخصم: ${deal.coupon_code}` : "") +
      `\n🛍️ اطلبه الآن: ${SITE_URL}/deals/${deal.id}` +
      `\n#عروض #السعودية #حكيم_AI`;
    return {
      title: `عرض اليوم: ${deal.title}`,
      text,
      link: `${SITE_URL}/deals/${deal.id}`,
      imageUrl: deal.image_url ?? null,
    };
  }

  const { data: coupons } = await db
    .from("coupons")
    .select("id,code,store_name,discount_value")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const coupon = (coupons ?? [])[0];
  if (coupon) {
    const text =
      `🎟️ كوبون جديد من حكيم AI: خصم ${coupon.discount_value ?? ""}% في ${coupon.store_name ?? "المتجر"}` +
      `\nالكود: ${coupon.code}\nفعّله من هنا: ${SITE_URL}/coupons/${coupon.id}` +
      `\n#كوبونات #خصومات #السعودية`;
    return {
      title: `كوبون ${coupon.store_name ?? "خصم"} — ${coupon.code}`,
      text,
      link: `${SITE_URL}/coupons/${coupon.id}`,
      imageUrl: null,
    };
  }

  return {
    title: "حكيم AI — أرخص أسعار السعودية",
    text:
      "🤖 حكيم AI يجمع لك عروض 65+ متجر سعودي لحظيًا ويقارن الأثمنة ويعطيك أرخص سعر مباشرة." +
      `\nجرّبه الآن: ${SITE_URL}\n#عروض #السعودية #حكيم_AI`,
    link: SITE_URL,
    imageUrl: null,
  };
}

/* ----------------------------- الناشرون ----------------------------- */

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function hmacSha256Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  let binary = "";
  for (const b of new Uint8Array(sig)) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function publishTweet(text: string): Promise<PublishResult> {
  const [consumerKey, consumerSecret, accessToken, accessSecret] = await Promise.all([
    getIntegrationKey("TWITTER_API_KEY"),
    getIntegrationKey("TWITTER_API_SECRET"),
    getIntegrationKey("TWITTER_ACCESS_TOKEN"),
    getIntegrationKey("TWITTER_ACCESS_SECRET"),
  ]);
  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    return { ok: false, error: "مفاتيح إكس (تويتر) غير مضبوطة في «مفاتيح النشر»" };
  }
  const url = "https://api.twitter.com/2/tweets";
  const oauth: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };
  const baseParams = Object.keys(oauth)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauth[k]!)}`)
    .join("&");
  const baseString = ["POST", percentEncode(url), percentEncode(baseParams)].join("&");
  const signature = await hmacSha256Base64(
    `${percentEncode(consumerSecret)}&${percentEncode(accessSecret)}`,
    baseString,
  );
  const header =
    "OAuth " +
    Object.entries({ ...oauth, oauth_signature: signature })
      .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
      .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: header, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 275) }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: { id?: string };
    detail?: string;
    title?: string;
  };
  if (!res.ok) return { ok: false, error: json.detail || json.title || `HTTP ${res.status}` };
  return { ok: true, externalId: json.data?.id };
}

async function publishInstagram(caption: string, imageUrl: string | null): Promise<PublishResult> {
  const [token, igId] = await Promise.all([
    getIntegrationKey("INSTAGRAM_ACCESS_TOKEN"),
    getIntegrationKey("INSTAGRAM_BUSINESS_ID"),
  ]);
  if (!token || !igId) {
    return { ok: false, error: "مفاتيح إنستغرام غير مضبوطة في «مفاتيح النشر»" };
  }
  const image = imageUrl || `${SITE_URL}/hkeeem_512.png`;
  const create = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media?image_url=${encodeURIComponent(image)}&caption=${encodeURIComponent(caption.slice(0, 2000))}&access_token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  const created = (await create.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!created.id) {
    return { ok: false, error: created.error?.message || `HTTP ${create.status}` };
  }
  const publish = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media_publish?creation_id=${created.id}&access_token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  const published = (await publish.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!published.id) {
    return { ok: false, error: published.error?.message || `HTTP ${publish.status}` };
  }
  return { ok: true, externalId: published.id };
}

async function publishTikTok(title: string, text: string): Promise<PublishResult> {
  const token = await getIntegrationKey("TIKTOK_ACCESS_TOKEN");
  if (!token) return { ok: false, error: "مفتاح تيك توك غير مضبوط في «مفاتيح النشر»" };
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/text/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      post_info: {
        title: title.slice(0, 90),
        description: text.slice(0, 400),
        privacy_level: "PUBLIC_TO_EVERYONE",
      },
      source_info: { source: "TEXT" },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
    data?: { publish_id?: string };
  };
  if (!res.ok || (json.error?.code && json.error.code !== "ok")) {
    return { ok: false, error: json.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, externalId: json.data?.publish_id };
}

async function publishSnapchat(): Promise<PublishResult> {
  const token = await getIntegrationKey("SNAPCHAT_ACCESS_TOKEN");
  if (!token) return { ok: false, error: "مفتاح سناب شات غير مضبوط في «مفاتيح النشر»" };
  // سناب شات لا يوفّر واجهة نشر عامة عبر الخوادم (يتطلب Snap Kit معتمدًا على الجهاز).
  return { ok: false, error: "سناب شات يتطلب تطبيق Snap Kit معتمدًا — النشر من الخادم غير متاح حاليًا" };
}

async function publishStorePush(content: Content): Promise<PublishResult> {
  const { readVapidKeys, sendPushBatch } = await import("@/lib/push.server");
  if (!readVapidKeys()) return { ok: false, error: "إعدادات الإشعارات (VAPID) غير مكتملة" };
  const db = await getAdmin();
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .limit(5000);
  if (!subs || subs.length === 0) return { ok: false, error: "لا يوجد مشتركي إشعارات بعد" };
  const result = await sendPushBatch(
    subs.map((s) => ({ id: s.id, endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
    { title: content.title, body: content.text.slice(0, 180), url: content.link, icon: `${SITE_URL}/hkeeem_512.png` },
  );
  if (result.sent === 0) return { ok: false, error: "تعذّر إرسال الإشعارات لكل المشتركين" };
  return { ok: true, externalId: `push-${result.sent}` };
}

/* ------------------------------ المشغّل ------------------------------ */

export async function runMarketingBots(platform?: string): Promise<MarketingBotRunResult> {
  const bots = await loadBots(platform);
  const content = await pickContent();
  const db = await getAdmin();
  const ran: MarketingBotRunResult["ran"] = [];
  const skipped: string[] = [];

  for (const bot of bots) {
    let result: PublishResult;
    try {
      switch (bot.platform) {
        case "twitter":
          result = await publishTweet(content.text);
          break;
        case "instagram":
          result = await publishInstagram(content.text, content.imageUrl);
          break;
        case "tiktok":
          result = await publishTikTok(content.title, content.text);
          break;
        case "snapchat":
          result = await publishSnapchat();
          break;
        case "store":
          result = await publishStorePush(content);
          break;
        default:
          result = { ok: false, error: `منصة غير معروفة: ${bot.platform}` };
      }
    } catch (error) {
      result = { ok: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" };
    }

    const { error: postError } = await db.from("marketing_posts").insert({
      platform: bot.platform,
      title: content.title,
      content: content.text,
      link_url: content.link,
      image_url: content.imageUrl,
      status: result.ok ? "published" : "failed",
      error: result.error ?? null,
      external_id: result.externalId ?? null,
      published_at: result.ok ? new Date().toISOString() : null,
    });

    await db
      .from("marketing_bots")
      .update({
        last_run_at: new Date().toISOString(),
        last_status: result.ok ? "published" : "failed",
        posts_count: bot.posts_count + (result.ok ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq("key", bot.key);

    ran.push({
      bot: bot.label,
      platform: bot.platform,
      ok: result.ok,
      error: postError?.message ?? result.error,
    });
  }

  const allPlatforms = new Set(["store", "twitter", "instagram", "tiktok", "snapchat"]);
  for (const p of allPlatforms) {
    if (platform && p !== platform) skipped.push(p);
  }

  return { ran, skipped };
}

export function siteUrl(): string {
  return SITE_URL;
}
