const DEFAULT_MEASUREMENT_ID = "G-QCKHXEMS2K";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

function ensureGtag() {
  if (typeof window === "undefined") return null;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });

  return window.gtag;
}

export function initGoogleAnalytics() {
  if (typeof window === "undefined" || !measurementId || initialized) return;

  const gtag = ensureGtag();
  if (!gtag) return;

  initialized = true;
  gtag("js", new Date());
  gtag("config", measurementId, { send_page_view: false });

  const scriptSelector = `script[src*="gtag/js?id=${measurementId}"]`;
  if (!document.head.querySelector(scriptSelector)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }
}

export function trackPageView(pathname: string) {
  if (typeof window === "undefined" || !measurementId) return;

  const gtag = ensureGtag();
  if (!gtag) return;

  gtag("event", "page_view", {
    page_path: pathname,
    page_location: window.location.href,
    page_title: document.title,
  });
}
