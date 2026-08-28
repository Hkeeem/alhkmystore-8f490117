import { buildPushPayload, type PushSubscription, type VapidKeys } from "@block65/webcrypto-web-push";

export interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
  tag?: string;
}

export function readVapidKeys(): VapidKeys | null {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] || "mailto:support@alhkmy.store";
  if (!publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function vapidPublicKey(): string | null {
  return process.env["VAPID_PUBLIC_KEY"] || null;
}

/** Sends one notification. Returns the HTTP status of the push service. */
export async function sendPush(
  sub: StoredSubscription,
  notification: PushNotificationPayload,
  ttlSeconds = 60 * 60 * 12,
): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const vapid = readVapidKeys();
  if (!vapid) return { ok: false, status: 0, gone: false };

  const subscription: PushSubscription = {
    endpoint: sub.endpoint,
    expirationTime: null,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  const payload = await buildPushPayload(
    { data: JSON.stringify(notification), options: { ttl: ttlSeconds, urgency: "normal" } },
    subscription,
    vapid,
  );

  const res = await fetch(sub.endpoint, {
    ...payload,
    body: payload.body as unknown as BodyInit,
  });
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}

/** Fan-out helper: sends to many subscriptions and reports dead endpoints. */
export async function sendPushBatch(
  subs: StoredSubscription[],
  notification: PushNotificationPayload,
): Promise<{ sent: number; failed: number; goneEndpoints: string[] }> {
  let sent = 0;
  let failed = 0;
  const goneEndpoints: string[] = [];

  const results = await Promise.allSettled(subs.map((s) => sendPush(s, notification)));
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.ok) sent += 1;
    else {
      failed += 1;
      if (r.status === "fulfilled" && r.value.gone) goneEndpoints.push(subs[i]!.endpoint);
    }
  });

  return { sent, failed, goneEndpoints };
}
