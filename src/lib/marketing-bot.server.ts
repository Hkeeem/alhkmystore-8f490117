/**
 * محرك بوتات التسويق: يختار أقوى عرض نشط ويصيغ منشورًا عربيًا ثم ينشره
 * على المنصة المطلوبة (تويتر / إنستغرام / تيك توك / سناب شات) أو يرسله
 * إشعارًا داخليًا (بوت تسويق المتاجر). المفاتيح تُقرأ من التخزين المشفّر
 * في قاعدة البيانات مع الرجوع لمتغيّرات البيئة.
 */

import { getIntegrationKey } from "@/lib/integration-keys.server";

export const MARKETING_PLATFORMS = ["store", "twitter", "instagram", "tiktok", "snapchat"] as const;
export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number];

const SITE_URL = "https://alhkmy.store";

export type MarketingRunResult = {
  ok: boolean;
  platform: MarketingPlatform;
  postId?: string;
  status: "published" | "pending" | "failed";
  message: string;
};

type PickedDeal = {
  title: string;
  price: number;
  originalPrice: number;
  discount: number;
  store: string;
  url: string;
  image: string | null;
  coupon: string | null;
};

/* --------------------------- اختيار المحتوى --------------------------- */

async function pickDeal(platform: MarketingPlatform): Promise<PickedDeal | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // تجنّب إعادة نشر نفس العنوان على نفس المنصة خلال آخر 3 أيام
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("marketing_posts")
    .select("title")
    .eq("platform", platform)
    .gte("created_at", since)
    .limit(50);
  const recentTitles = new Set((recent ?? []).map((r) => r.title).filter(Boolean));

  const { data: deals } = await supabaseAdmin
    .from("external_deals")
    .select("title, price, original_price, discount_percent, store_name, product_url, image_url")
    .eq("active", true)
    .order("discount_percent", { ascending: false })
    .limit(30);

  const deal = (deals ?? []).find((d) => d.title && !recentTitles.has(d.title));
  if (deal) {
    return {
      title: deal.title,
      price: Number(deal.price),
      originalPrice: Number(deal.original_price),
      discount: deal.discount_percent ?? 0,
      store: deal.store_name ?? "المتجر",
      url: deal.product_url ?? SITE_URL,
      image: deal.image_url,
      coupon: null,
    };
  }

  const { data: coupons } = await supabaseAdmin
    .from("coupons")
    .select("code, title, store_name, discount")
    .eq("active", true)
    .limit(20);
  const coupon = (coupons ?? []).find((c) => !recentTitles.has(c.title));
  if (!coupon) return null;
  return {
    title: coupon.title,
    price: 0,
    originalPrice: 0,
    discount: 0,
    store: coupon.store_name,
    url: SITE_URL,
    image: null,
    coupon: coupon.code,
  };
}

function composePost(deal: PickedDeal): { title: string; content: string } {
  if (deal.coupon) {
    return {
      title: deal.title,
      content: `🎟️ ${deal.title}\nكود الخصم: ${deal.coupon} في ${deal.store}\nتسوّق الآن: ${deal.url}\n#عروض #كوبونات #حكيم`,
    };
  }
  return {
    title: deal.title,
    content: `🔥 خصم ${deal.discount}% في ${deal.store}!\n${deal.title}\nالسعر الآن: ${deal.price} ر.س بدلًا من ${deal.originalPrice} ر.س\nالعرض: ${deal.url}\n#عروض_السعودية #توفير #حكيم`,
  };
}

/* ------------------------------ تويتر ------------------------------ */

function percentEncode(s: string) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  let binary = "";
  new Uint8Array(sig).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function publishTwitter(content: string): Promise<{ id: string }> {
  const apiKey = await getIntegrationKey("TWITTER_API_KEY");
  const apiSecret = await getIntegrationKey("TWITTER_API_SECRET");
  const accessToken = await getIntegrationKey("TWITTER_ACCESS_TOKEN");
  const accessSecret = await getIntegrationKey("TWITTER_ACCESS_SECRET");
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("مفاتيح تويتر غير مكتملة");
  }

  const url = "https://api.twitter.com/2/tweets";
  const oauth: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };
  const paramString = Object.keys(oauth)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauth[k]!)}`)
    .join("&");
  const base = `POST&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signature = await hmacSha1(`${percentEncode(apiSecret)}&${percentEncode(accessSecret)}`, base);
  const header =
    "OAuth " +
    Object.entries({ ...oauth, oauth_signature: signature })
      .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
      .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: header, "Content-Type": "application/json" },
    body: JSON.stringify({ text: content.slice(0, 280) }),
  });
  if (!res.ok) throw new Error(`twitter ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { data?: { id?: string } };
  return { id: json.data?.id ?? "" };
}

/* ----------------------------- إنستغرام ----------------------------- */

async function publishInstagram(
  content: string,
  image: string | null,
): Promise<{ id: string }> {
  const userId = await getIntegrationKey("INSTAGRAM_BUSINESS_ID");
  const token = await getIntegrationKey("INSTAGRAM_ACCESS_TOKEN");
  if (!userId || !token) throw new Error("مفاتيح إنستغرام غير مكتملة");
  if (!image) throw new Error("إنستغرام يتطلب صورة للعرض");

  const base = `https://graph.facebook.com/v21.0/${userId}`;
  const createRes = await fetch(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: image, caption: content.slice(0, 2200), access_token: token }),
  });
  if (!createRes.ok) throw new Error(`instagram media ${createRes.status}`);
  const created = (await createRes.json()) as { id?: string };
  if (!created.id) throw new Error("instagram: no media id");

  const pubRes = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: created.id, access_token: token }),
  });
  if (!pubRes.ok) throw new Error(`instagram publish ${pubRes.status}`);
  const pub = (await pubRes.json()) as { id?: string };
  return { id: pub.id ?? created.id };
}

/* ------------------------------ تيك توك ------------------------------ */

async function publishTikTok(title: string, content: string): Promise<{ id: string }> {
  const token = await getIntegrationKey("TIKTOK_ACCESS_TOKEN");
  if (!token) throw new Error("مفتاح تيك توك غير مضاف");

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      post_info: { title: `${title}\n${content}`.slice(0, 2200), privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", video_url: `${SITE_URL}/media/promo.mp4` },
    }),
  });
  const json = (await res.json()) as { data?: { publish_id?: string }; error?: { message?: string } };
  if (!res.ok || !json.data?.publish_id) {
    throw new Error(`tiktok: ${json.error?.message ?? res.status}`);
  }
  return { id: json.data.publish_id };
}

/* ------------------------------ سناب شات ------------------------------ */

async function publishSnapchat(title: string, url: string): Promise<{ id: string }> {
  const token = await getIntegrationKey("SNAPCHAT_ACCESS_TOKEN");
  const profileId = await getIntegrationKey("SNAPCHAT_PROFILE_ID");
  if (!token || !profileId) throw new Error("مفاتيح سناب شات غير مكتملة");

  const res = await fetch(
    `https://businessapi.snapchat.com/v1/public_profiles/${profileId}/spotlight_posts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.slice(0, 80), attachment_url: url }),
    },
  );
  if (!res.ok) throw new Error(`snapchat ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? "" };
}

/* --------------------------- البوت الداخلي (Push) --------------------------- */

async function publishStore(title: string, content: string, url: string, image: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .lt("failure_count", 5)
    .limit(500);
  if (!subs || subs.length === 0) return { id: "no-subscribers" };

  const { sendPushBatch } = await import("@/lib/push.server");
  const result = await sendPushBatch(subs, {
    title,
    body: content.split("\n").slice(0, 2).join(" ").slice(0, 180),
    url,
    image: image ?? undefined,
    tag: "marketing",
  });
  return { id: `push:${result.sent}` };
}

/* ------------------------------ المحرك ------------------------------ */

export async function runMarketingBot(platform: MarketingPlatform): Promise<MarketingRunResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const botKey = platform === "store" ? "store_marketing" : platform;

  const finish = async (r: MarketingRunResult) => {
    await supabaseAdmin
      .from("marketing_bots")
      .update({
        last_run_at: new Date().toISOString(),
        last_status: r.status,
        ...(r.status === "published" ? {} : {}),
      })
      .eq("key", botKey);
    return r;
  };

  const deal = await pickDeal(platform);
  if (!deal) {
    return finish({ ok: false, platform, status: "failed", message: "لا يوجد محتوى جديد للنشر" });
  }
  const post = composePost(deal);

  let status: MarketingRunResult["status"] = "pending";
  let externalId: string | null = null;
  let errorMsg: string | null = null;

  try {
    if (platform === "store") externalId = (await publishStore(post.title, post.content, deal.url, deal.image)).id;
    else if (platform === "twitter") externalId = (await publishTwitter(post.content)).id;
    else if (platform === "instagram") externalId = (await publishInstagram(post.content, deal.image)).id;
    else if (platform === "tiktok") externalId = (await publishTikTok(post.title, post.content)).id;
    else externalId = (await publishSnapchat(post.title, deal.url)).id;
    status = "published";
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : "publish_failed";
    // غياب المفاتيح = يُحفظ المنشور بانتظار الربط بدل الفشل
    status = /مفاتيح|مفتاح/.test(errorMsg) ? "pending" : "failed";
  }

  const { data: inserted } = await supabaseAdmin
    .from("marketing_posts")
    .insert({
      platform,
      title: post.title,
      content: post.content,
      image_url: deal.image,
      link_url: deal.url,
      status,
      external_id: externalId,
      error: errorMsg,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (status === "published") {
    await supabaseAdmin.rpc("increment_marketing_posts_count" as never, { _key: botKey } as never).catch?.(() => undefined);
    // fallback بسيط لو الدالة غير موجودة
    const { data: bot } = await supabaseAdmin
      .from("marketing_bots")
      .select("posts_count")
      .eq("key", botKey)
      .single();
    await supabaseAdmin
      .from("marketing_bots")
      .update({ posts_count: (bot?.posts_count ?? 0) + 1 })
      .eq("key", botKey);
  }

  return finish({
    ok: status !== "failed",
    platform,
    postId: inserted?.id,
    status,
    message: errorMsg ?? (status === "published" ? "تم النشر" : "بانتظار ربط المفاتيح"),
  });
}
