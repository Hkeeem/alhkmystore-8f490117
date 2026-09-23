/**
 * بوتات التسويق: تختار أقوى عرض متاح وتنشره على المنصات الاجتماعية.
 * كل منصة لها مفتاح تشغيل مستقل؛ عند غياب المفاتيح يُحفظ المنشور بحالة "بالانتظار".
 */

export type MarketingPlatform = "store" | "twitter" | "instagram" | "tiktok" | "snapchat";

export const MARKETING_PLATFORMS: MarketingPlatform[] = [
  "store",
  "twitter",
  "instagram",
  "tiktok",
  "snapchat",
];

const SITE_URL = "https://alhkmy.store";

type Candidate = {
  title: string;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  image: string | null;
  link: string | null;
  store: string | null;
  coupon?: string | null;
};

function money(n: number | null) {
  if (n == null) return null;
  return `${Math.round(n).toLocaleString("ar-SA")} ر.س`;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (t: string) => any;
  };
}

/** يختار عرضًا لم يُنشر مؤخرًا على نفس المنصة. */
async function pickCandidate(platform: MarketingPlatform): Promise<Candidate | null> {
  const db = await admin();

  const { data: recent } = await db
    .from("marketing_posts")
    .select("title")
    .eq("platform", platform)
    .order("created_at", { ascending: false })
    .limit(30);
  const seen = new Set<string>((recent ?? []).map((r: { title: string | null }) => r.title ?? ""));

  const { data: deals } = await db
    .from("external_deals")
    .select("title, store_name, price, original_price, discount_percent, image_url, product_url")
    .eq("active", true)
    .order("discount_percent", { ascending: false })
    .limit(40);

  for (const d of deals ?? []) {
    if (!d?.title || seen.has(d.title)) continue;
    return {
      title: d.title,
      price: d.price ?? null,
      originalPrice: d.original_price ?? null,
      discount: d.discount_percent ?? null,
      image: d.image_url ?? null,
      link: d.product_url ?? null,
      store: d.store_name ?? null,
    };
  }

  const { data: coupons } = await db
    .from("coupons")
    .select("title, store_name, code, discount")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  for (const c of coupons ?? []) {
    if (!c?.title || seen.has(c.title)) continue;
    return {
      title: c.title,
      price: null,
      originalPrice: null,
      discount: null,
      image: null,
      link: `${SITE_URL}/coupons`,
      store: c.store_name ?? null,
      coupon: c.code ?? null,
    };
  }

  return null;
}

function buildContent(platform: MarketingPlatform, c: Candidate) {
  const lines: string[] = [];
  lines.push(`🔥 ${c.title}`);
  if (c.store) lines.push(`🏬 ${c.store}`);
  if (c.price != null) {
    const now = money(c.price);
    const before = money(c.originalPrice);
    lines.push(before && c.originalPrice && c.originalPrice > c.price ? `💰 ${now} بدل ${before}` : `💰 ${now}`);
  }
  if (c.discount) lines.push(`📉 خصم ${c.discount}%`);
  if (c.coupon) lines.push(`🎟️ كوبون: ${c.coupon}`);
  lines.push(c.link ?? SITE_URL);

  const tags =
    platform === "twitter"
      ? "\n\n#عروض_السعودية #حكيم #تخفيضات"
      : "\n\n#عروض #السعودية #حكيم #تخفيضات #كوبونات #توفير";

  let text = lines.join("\n") + tags;
  if (platform === "twitter" && text.length > 275) text = `${text.slice(0, 272)}...`;
  return text;
}

/* ------------------------------- النشر ------------------------------- */

type PublishResult = { status: "published" | "pending" | "failed"; externalId?: string; error?: string };

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

async function hmacSha1(key: string, msg: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function rfc3986(s: string) {
  return encodeURIComponent(s).replace(/[!*'()]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function publishTwitter(text: string): Promise<PublishResult> {
  const apiKey = env("TWITTER_API_KEY");
  const apiSecret = env("TWITTER_API_SECRET");
  const token = env("TWITTER_ACCESS_TOKEN");
  const tokenSecret = env("TWITTER_ACCESS_SECRET");
  if (!apiKey || !apiSecret || !token || !tokenSecret) {
    return { status: "pending", error: "مفاتيح إكس غير مضبوطة" };
  }

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
    rfc3986(url),
    rfc3986(
      Object.keys(params)
        .sort()
        .map((k) => `${rfc3986(k)}=${rfc3986(params[k]!)}`)
        .join("&"),
    ),
  ].join("&");
  const signature = await hmacSha1(`${rfc3986(apiSecret)}&${rfc3986(tokenSecret)}`, base);
  const header = `OAuth ${Object.entries({ ...params, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${rfc3986(k)}="${rfc3986(v)}"`)
    .join(", ")}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: header, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "failed", error: body?.detail ?? body?.title ?? `HTTP ${res.status}` };
  return { status: "published", externalId: body?.data?.id };
}

async function publishInstagram(text: string, image: string | null): Promise<PublishResult> {
  const userId = env("INSTAGRAM_USER_ID");
  const token = env("INSTAGRAM_ACCESS_TOKEN");
  if (!userId || !token) return { status: "pending", error: "مفاتيح إنستغرام غير مضبوطة" };
  if (!image) return { status: "pending", error: "العرض بلا صورة صالحة للنشر" };

  const create = await fetch(`https://graph.facebook.com/v21.0/${userId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: image, caption: text, access_token: token }),
  });
  const created: any = await create.json().catch(() => ({}));
  if (!create.ok || !created?.id) {
    return { status: "failed", error: created?.error?.message ?? `HTTP ${create.status}` };
  }

  const publish = await fetch(`https://graph.facebook.com/v21.0/${userId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: created.id, access_token: token }),
  });
  const published: any = await publish.json().catch(() => ({}));
  if (!publish.ok) return { status: "failed", error: published?.error?.message ?? `HTTP ${publish.status}` };
  return { status: "published", externalId: published?.id };
}

async function publishTiktok(text: string, image: string | null): Promise<PublishResult> {
  const token = env("TIKTOK_ACCESS_TOKEN");
  if (!token) return { status: "pending", error: "مفتاح تيك توك غير مضبوط" };
  if (!image) return { status: "pending", error: "العرض بلا صورة صالحة للنشر" };

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: { title: text.slice(0, 90), description: text.slice(0, 4000), privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [image] },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    }),
  });
  const body: any = await res.json().catch(() => ({}));
  const code = body?.error?.code;
  if (!res.ok || (code && code !== "ok")) {
    return { status: "failed", error: body?.error?.message ?? `HTTP ${res.status}` };
  }
  return { status: "published", externalId: body?.data?.publish_id };
}

async function publishSnapchat(text: string, image: string | null, link: string | null): Promise<PublishResult> {
  const token = env("SNAPCHAT_ACCESS_TOKEN");
  const profileId = env("SNAPCHAT_PROFILE_ID");
  if (!token || !profileId) return { status: "pending", error: "مفاتيح سناب شات غير مضبوطة" };

  const res = await fetch(`https://businessapi.snapchat.com/v1/public_profiles/${profileId}/spotlight_posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ caption: text.slice(0, 250), media_url: image, attachment_url: link ?? SITE_URL }),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "failed", error: body?.error_message ?? body?.message ?? `HTTP ${res.status}` };
  return { status: "published", externalId: body?.id };
}

/** بوت تسويق المتاجر: ينشر العرض داخل المنصة كتنبيه فوري لكل المشتركين. */
async function publishStore(
  text: string,
  link: string | null,
  title: string,
  image: string | null,
): Promise<PublishResult> {
  try {
    const db = await admin();
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .lt("failure_count", 5)
      .limit(500);
    const list = (subs ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[];
    if (!list.length) return { status: "pending", error: "لا يوجد مشتركون في الإشعارات" };

    const { sendPushBatch } = await import("@/lib/push.server");
    const res = await sendPushBatch(list, {
      title: `عرض حكيم: ${title}`.slice(0, 80),
      body: text.split("\n").slice(1, 4).join(" • ").slice(0, 160),
      url: link ?? SITE_URL,
      image: image ?? undefined,
      tag: "marketing",
    });
    if (!res.sent) return { status: "failed", error: `لم يصل أي إشعار (${res.failed} فشل)` };
    return { status: "published", externalId: `push:${res.sent}` };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

/* ------------------------------ التشغيل ------------------------------ */

export async function runMarketingBot(platform: MarketingPlatform) {
  const db = await admin();

  const { data: bot } = await db.from("marketing_bots").select("*").eq("key", platform).maybeSingle();
  if (bot && bot.enabled === false) {
    return { ok: false, skipped: true, message: "البوت متوقف" };
  }

  const candidate = await pickCandidate(platform);
  if (!candidate) {
    await db
      .from("marketing_bots")
      .update({ last_run_at: new Date().toISOString(), last_status: "no_content" })
      .eq("key", platform);
    return { ok: false, message: "لا يوجد عرض جديد للنشر" };
  }

  const text = buildContent(platform, candidate);

  let result: PublishResult;
  try {
    if (platform === "twitter") result = await publishTwitter(text);
    else if (platform === "instagram") result = await publishInstagram(text, candidate.image);
    else if (platform === "tiktok") result = await publishTiktok(text, candidate.image);
    else if (platform === "snapchat") result = await publishSnapchat(text, candidate.image, candidate.link);
    else result = await publishStore(text, candidate.link, candidate.title);
  } catch (error) {
    result = { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }

  await db.from("marketing_posts").insert({
    platform,
    title: candidate.title,
    content: text,
    image_url: candidate.image,
    link_url: candidate.link,
    status: result.status,
    external_id: result.externalId ?? null,
    error: result.error ?? null,
    published_at: result.status === "published" ? new Date().toISOString() : null,
  });

  const nextCount = (bot?.posts_count ?? 0) + (result.status === "published" ? 1 : 0);
  await db
    .from("marketing_bots")
    .update({ last_run_at: new Date().toISOString(), last_status: result.status, posts_count: nextCount })
    .eq("key", platform);

  return {
    ok: result.status === "published",
    status: result.status,
    message:
      result.status === "published"
        ? `تم نشر «${candidate.title}»`
        : result.status === "pending"
          ? `جُهِّز المنشور وينتظر الربط: ${result.error ?? ""}`
          : `فشل النشر: ${result.error ?? ""}`,
  };
}
