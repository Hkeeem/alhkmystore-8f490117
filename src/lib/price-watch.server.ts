/** Server-only: daily snapshot of changed prices + price alert checks. */
import {
  sendPushBatch,
  type StoredSubscription,
  type PushNotificationPayload,
} from "./push.server";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PriceWatchResult {
  scanned: number;
  recorded: number;
  alertsChecked: number;
  alertsTriggered: number;
  sent: number;
  failed: number;
}

interface PriceRow {
  productId: string;
  storeId: string;
  price: number;
  dealId: string;
  title: string;
}

/** يجمع الأسعار الحالية من عروض التجار والعروض الخارجية. */
async function collectCurrentPrices(supabaseAdmin: {
  from: (t: string) => any;
}): Promise<PriceRow[]> {
  const [merchant, external] = await Promise.all([
    supabaseAdmin
      .from("merchant_deals")
      .select("id, title, price, merchant_id")
      .eq("status", "published")
      .limit(1000),
    supabaseAdmin
      .from("external_deals")
      .select("id, title, price, product_key, store_id")
      .eq("active", true)
      .limit(1000),
  ]);

  const rows: PriceRow[] = [];
  for (const d of (merchant.data ?? []) as {
    id: string;
    title: string;
    price: number | string;
    merchant_id: string;
  }[]) {
    const price = Number(d.price);
    if (!Number.isFinite(price)) continue;
    rows.push({
      productId: d.id,
      storeId: d.merchant_id ?? "merchant",
      price,
      dealId: d.id,
      title: d.title,
    });
  }
  for (const d of (external.data ?? []) as {
    id: string;
    title: string;
    price: number | string;
    product_key: string | null;
    store_id: string | null;
  }[]) {
    const price = Number(d.price);
    if (!Number.isFinite(price)) continue;
    rows.push({
      productId: d.product_key || d.id,
      storeId: d.store_id ?? "external",
      price,
      dealId: d.id,
      title: d.title,
    });
  }
  return rows;
}

export async function runPriceWatch(): Promise<PriceWatchResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as { from: (t: string) => any };

  const rows = await collectCurrentPrices(admin);
  const result: PriceWatchResult = {
    scanned: rows.length,
    recorded: 0,
    alertsChecked: 0,
    alertsTriggered: 0,
    sent: 0,
    failed: 0,
  };

  // 1) سجّل سعرًا جديدًا فقط عند تغيّره عن آخر قيمة مسجّلة.
  for (const row of rows) {
    const { data: last } = await admin
      .from("price_history")
      .select("price")
      .eq("product_id", row.productId)
      .eq("store_id", row.storeId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastPrice = last ? Number((last as { price: number }).price) : null;
    if (lastPrice !== null && Math.abs(lastPrice - row.price) < 0.005) continue;

    const { error } = await admin
      .from("price_history")
      .insert({ product_id: row.productId, store_id: row.storeId, price: row.price });
    if (!error) result.recorded += 1;
  }

  // 2) افحص تنبيهات الأسعار المفعّلة.
  const { data: alertsRaw } = await admin
    .from("price_alerts")
    .select("id, user_id, deal_id, product_key, title, target_price, last_notified_at")
    .eq("active", true)
    .limit(500);

  const alerts = (alertsRaw ?? []) as {
    id: string;
    user_id: string;
    deal_id: string;
    product_key: string | null;
    title: string;
    target_price: number | string;
    last_notified_at: string | null;
  }[];
  result.alertsChecked = alerts.length;
  if (alerts.length === 0) return result;

  const byDeal = new Map<string, PriceRow>();
  const byProduct = new Map<string, PriceRow>();
  for (const row of rows) {
    const prevDeal = byDeal.get(row.dealId);
    if (!prevDeal || row.price < prevDeal.price) byDeal.set(row.dealId, row);
    const prevProduct = byProduct.get(row.productId);
    if (!prevProduct || row.price < prevProduct.price) byProduct.set(row.productId, row);
  }

  const now = Date.now();
  for (const alert of alerts) {
    const current =
      byDeal.get(alert.deal_id) ?? (alert.product_key ? byProduct.get(alert.product_key) : null);
    if (!current) continue;

    const target = Number(alert.target_price);
    if (!Number.isFinite(target) || current.price > target) continue;

    const lastNotified = alert.last_notified_at ? Date.parse(alert.last_notified_at) : 0;
    if (lastNotified && now - lastNotified < DAY_MS) continue;

    const nowIso = new Date(now).toISOString();
    const title = "📉 وصل السعر لهدفك";
    const body = `${alert.title} الآن بـ ${current.price} ر.س (هدفك ${target} ر.س)`;
    const url = `/deals/${alert.deal_id}`;

    await admin
      .from("notifications")
      .insert({ user_id: alert.user_id, title, body, link: url });

    const { data: subsRaw } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", alert.user_id)
      .lt("failure_count", 5);

    const subs = (subsRaw ?? []) as StoredSubscription[];
    if (subs.length > 0) {
      const payload: PushNotificationPayload = { title, body, url, tag: `alert:${alert.id}` };
      const push = await sendPushBatch(subs, payload);
      result.sent += push.sent;
      result.failed += push.failed;
    }

    await admin
      .from("price_alerts")
      .update({
        last_notified_at: nowIso,
        triggered_at: nowIso,
        current_price: current.price,
      })
      .eq("id", alert.id);

    result.alertsTriggered += 1;
  }

  return result;
}
