import { useCallback, useEffect, useState } from "react";
import {
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  sendTestPush,
} from "@/lib/push.functions";

export type PushSupport =
  | "checking"
  | "supported"
  | "no-service-worker"
  | "no-push-api"
  | "no-notification-api"
  | "insecure-context";

export interface PushState {
  support: PushSupport;
  subscribed: boolean;
  busy: boolean;
  endpoint: string | null;
  serverConfigured: boolean;
  subscribe: () => Promise<{ ok: boolean; reason?: string }>;
  unsubscribe: () => Promise<void>;
  test: () => Promise<{ ok: boolean; reason?: string }>;
  refresh: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function detectSupport(): PushSupport {
  if (typeof window === "undefined") return "checking";
  if (!window.isSecureContext) return "insecure-context";
  if (!("Notification" in window)) return "no-notification-api";
  if (!("serviceWorker" in navigator)) return "no-service-worker";
  if (!("PushManager" in window)) return "no-push-api";
  return "supported";
}

async function readySW(): Promise<ServiceWorkerRegistration | null> {
  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (!existing) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        return null;
      }
    }
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export function usePush(): PushState {
  const [support, setSupport] = useState<PushSupport>("checking");
  const [subscribed, setSubscribed] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(true);

  const refresh = useCallback(async () => {
    const s = detectSupport();
    setSupport(s);
    if (s !== "supported") return;
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setSubscribed(Boolean(sub));
      setEndpoint(sub?.endpoint ?? null);
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void getVapidPublicKey()
      .then((r) => setServerConfigured(Boolean(r?.configured)))
      .catch(() => setServerConfigured(false));
  }, [refresh]);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; reason?: string }> => {
    if (detectSupport() !== "supported") return { ok: false, reason: "unsupported" };
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return { ok: false, reason: permission };

      const { publicKey } = await getVapidPublicKey();
      if (!publicKey) return { ok: false, reason: "server_not_configured" };

      const reg = await readySW();
      if (!reg) return { ok: false, reason: "no_sw" };

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        }));

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        return { ok: false, reason: "bad_subscription" };
      }

      await savePushSubscription({
        data: {
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          userAgent: navigator.userAgent.slice(0, 400),
        },
      });

      setSubscribed(true);
      setEndpoint(json.endpoint);
      return { ok: true };
    } catch {
      return { ok: false, reason: "error" };
    } finally {
      setBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await savePushRemoval(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setEndpoint(null);
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async (): Promise<{ ok: boolean; reason?: string }> => {
    if (!endpoint) return { ok: false, reason: "not_subscribed" };
    setBusy(true);
    try {
      const res = await sendTestPush({ data: { endpoint } });
      return { ok: Boolean(res?.sent), reason: res?.reason };
    } catch {
      return { ok: false, reason: "error" };
    } finally {
      setBusy(false);
    }
  }, [endpoint]);

  return {
    support,
    subscribed,
    busy,
    endpoint,
    serverConfigured,
    subscribe,
    unsubscribe,
    test,
    refresh,
  };
}

async function savePushRemoval(ep: string) {
  try {
    await removePushSubscription({ data: { endpoint: ep } });
  } catch {
    /* noop */
  }
}
