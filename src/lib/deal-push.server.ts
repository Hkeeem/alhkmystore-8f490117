/** Server-only: scans for deals expiring within 24h and freshly added coupons,
    then pushes a notification once per item (deduped through push_dispatch_log). */
import { sendPushBatch, type StoredSubscription, type PushNotificationPayload } from "./push.server";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DealPushResult {
  expiringNotified: number;
  couponsNotified: number;
  sent: number;
  failed: number;
  subscriptions: number;
  reason?: string;
}

export async function runDealPushSweep(): Promise<DealPushResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const empty: DealPushResult = {
    expiringNotified: 0,
    couponsNotified: 0,
    sent: 0,
    failed: 0,
    subscriptions: 0,
  };

  const { data: subsRaw } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .lt("failure_count", 5);

  const subs = (subsRaw ?? []) as StoredSubscription[];
  if (subs.length === 0) return { ...empty, reason: "no_subscriptions" };

  // إعدادات لوحة تنبيهات العروض (وقت التنبيه قبل الانتهاء)
  const { data: settings } = await supabaseAdmin
    .from("deal_alert_settings")
    .select("enabled, lead_hours, coupons_enabled, coupon_window_hours")
    .maybeSingle();

  const enabled = settings?.enabled ?? true;
  if (!enabled) return { ...empty, subscriptions: subs.length, reason: "alerts_disabled" };
  const leadMs = Math.min(168, Math.max(1, settings?.lead_hours ?? 24)) * 60 * 60 * 1000;
  const couponsEnabled = settings?.coupons_enabled ?? true;
  const couponWindowMs = Math.min(168, Math.max(1, settings?.coupon_window_hours ?? 24)) * 60 * 60 * 1000;

  const now = Date.now();
  const soonIso = new Date(now + leadMs).toISOString();
  const nowIso = new Date(now).toISOString();

  // 1) Deals (merchant + external) that expire within the next 24 hours.
  const [merchant, external] = await Promise.all([
    supabaseAdmin
      .from("merchant_deals")
      .select("id, title, price, expires_at")
      .eq("status", "published")
      .not("expires_at", "is", null)
      .gt("expires_at", nowIso)
      .lte("expires_at", soonIso)
      .limit(20),
    supabaseAdmin
      .from("external_deals")
      .select("id, title, price, expires_at, store_name")
      .eq("active", true)
      .not("expires_at", "is", null)
      .gt("expires_at", nowIso)
      .lte("expires_at", soonIso)
      .limit(20),
  ]);

  const leadLabel = `${Math.round(leadMs / (60 * 60 * 1000))} ساعة`;
  const expiring = [
    ...(merchant.data ?? []).map((d) => ({
      key: `expiring:merchant:${d.id}`,
      title: "⏰ آخر فرصة للعرض",
      body: `${d.title} — ينتهي خلال أقل من ${leadLabel} (${Number(d.price)} ر.س)`,
      url: `/deal/${d.id}`,
    })),
    ...(external.data ?? []).map((d) => ({
      key: `expiring:external:${d.id}`,
      title: "⏰ آخر فرصة للعرض",
      body: `${d.title}${d.store_name ? ` — ${d.store_name}` : ""} ينتهي خلال أقل من ${leadLabel}`,
      url: `/deal/${d.id}`,
    })),
  ];

  // 2) Coupons added within the configured window.
  const { data: coupons } = couponsEnabled
    ? await supabaseAdmin
        .from("coupons")
        .select("id, store_name, code, title, created_at")
        .eq("active", true)
        .gte("created_at", new Date(now - couponWindowMs).toISOString())
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] as { id: string; store_name: string; code: string; title: string; created_at: string }[] };

  const couponItems = (coupons ?? []).map((c) => ({
    key: `coupon:${c.id}`,
    title: "🎟️ كوبون خصم جديد",
    body: `${c.store_name}: ${c.title} — الكود ${c.code}`,
    url: `/coupons/${c.id}`,
  }));

  const all = [...expiring, ...couponItems];
  if (all.length === 0) return { ...empty, subscriptions: subs.length, reason: "nothing_to_send" };

  let sent = 0;
  let failed = 0;
  let expiringNotified = 0;
  let couponsNotified = 0;
  const gone = new Set<string>();

  for (const item of all) {
    // Claim the item first: the unique key makes a duplicate insert fail, so
    // an already-notified deal or coupon is never pushed twice.
    const { error: claimError } = await supabaseAdmin
      .from("push_dispatch_log")
      .insert({ dispatch_key: item.key, kind: item.key.split(":")[0]! });
    if (claimError) continue;

    const payload: PushNotificationPayload = {
      title: item.title,
      body: item.body,
      url: item.url,
      tag: item.key,
    };
    const result = await sendPushBatch(subs, payload);
    sent += result.sent;
    failed += result.failed;
    result.goneEndpoints.forEach((e) => gone.add(e));
    if (item.key.startsWith("coupon:")) couponsNotified += 1;
    else expiringNotified += 1;

    await supabaseAdmin
      .from("push_dispatch_log")
      .update({ sent: result.sent, failed: result.failed })
      .eq("dispatch_key", item.key);
  }

  if (gone.size > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", [...gone]);
  }

  return {
    expiringNotified,
    couponsNotified,
    sent,
    failed,
    subscriptions: subs.length,
  };
}
