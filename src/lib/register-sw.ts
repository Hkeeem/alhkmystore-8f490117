// Guarded service-worker registration.
// Refuses to register in dev, iframes, Lovable preview hosts, or when ?sw=off is set.
// In any refused context, actively unregisters any matching /sw.js registration
// so previews never serve stale HTML from a previously installed worker.

const SW_PATH = "/sw.js";
// Bump to force every client to drop old caches once (fixes unstyled pages
// caused by a stale precached HTML shell pointing at removed asset hashes).
const CACHE_EPOCH = "2";
const EPOCH_KEY = "hkeeem-sw-epoch";

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" || h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")
  ) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => (r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "").endsWith(SW_PATH))
        .map((r) => r.unregister()),
    );
  } catch { /* noop */ }
}

async function purgeStaleCaches() {
  try {
    if (typeof caches === "undefined") return;
    const keys = await caches.keys();
    await Promise.allSettled(keys.map((k) => caches.delete(k)));
  } catch { /* noop */ }
}

export async function registerSW() {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(EPOCH_KEY) !== CACHE_EPOCH) {
        window.localStorage.setItem(EPOCH_KEY, CACHE_EPOCH);
        await unregisterMatching();
        await purgeStaleCaches();
      }
    } catch { /* noop */ }
  }
  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch { /* noop */ }
}
