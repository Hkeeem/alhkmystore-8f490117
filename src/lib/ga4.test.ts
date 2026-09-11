import { beforeEach, describe, expect, it, vi } from "vitest";
import { initGoogleAnalytics, trackPageView } from "./ga4";

describe("Google Analytics 4", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    window.dataLayer = [];
    window.gtag = undefined;
    vi.resetModules();
  });

  it("initializes the official GA4 script once without exposing private keys", async () => {
    const { initGoogleAnalytics: init } = await import("./ga4");

    init();
    init();

    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length).toBe(1);
    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer?.[0]).toEqual(["js", expect.any(Date)]);
    expect(window.dataLayer?.[1]).toEqual(["config", "G-MYXCEL469D", { send_page_view: false }]);
  });

  it("sends an explicit page_view with the current SPA path", () => {
    initGoogleAnalytics();
    window.history.pushState({}, "", "/coupons");

    trackPageView("/coupons");

    expect(window.dataLayer?.at(-1)).toEqual([
      "event",
      "page_view",
      expect.objectContaining({
        page_path: "/coupons",
        page_location: expect.stringContaining("/coupons"),
        page_title: document.title,
      }),
    ]);
  });
});
