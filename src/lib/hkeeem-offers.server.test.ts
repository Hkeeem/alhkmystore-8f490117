import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHkeeemOffers, fetchHkeeemStores, normalizeOffer } from "./hkeeem-offers.server";

const KEY = "test-integration-key";

beforeEach(() => {
  process.env["HKEEEM_INTEGRATION_KEY"] = KEY;
  vi.restoreAllMocks();
});

function mockFetch(payload: unknown, ok = true, status = 200) {
  const spy = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  } as unknown as Response);
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("hkeeem offers server", () => {
  it("يرسل ترويسة التكامل الصحيحة من الخادم", async () => {
    const spy = mockFetch({ data: [] });
    await fetchHkeeemOffers({ category: `c-${Math.random()}` });
    const [, init] = spy.mock.calls[0];
    expect((init.headers as Record<string, string>)["X-Hkeeem-Integration-Key"]).toBe(KEY);
  });

  it("لا يكشف المفتاح في رسائل الخطأ ويعرض رسالة آمنة للمصادقة", async () => {
    mockFetch({ error: "invalid-integration-key" }, false, 401);
    await expect(fetchHkeeemOffers({ platform: `p-${Math.random()}` })).rejects.toThrow(
      /HKEEEM_AUTH: مفتاح التكامل/,
    );
    try {
      await fetchHkeeemOffers({ platform: `p2-${Math.random()}` });
    } catch (e) {
      expect(String((e as Error).message)).not.toContain(KEY);
    }
  });

  it("يعرض رسالة مختلفة لخطأ 429", async () => {
    mockFetch({ error: "rate-limit" }, false, 429);
    await expect(fetchHkeeemOffers({})).rejects.toThrow(/HKEEEM_RATE_LIMIT:/);
  });

  it("يعرض رسالة مختلفة لخطأ 5xx", async () => {
    mockFetch({ error: "server-error" }, false, 503);
    await expect(fetchHkeeemOffers({})).rejects.toThrow(/HKEEEM_SERVER:/);
  });

  it("يتجاهل العروض الناقصة (بدون عنوان أو رابط شراء)", () => {
    expect(normalizeOffer({ title: "بدون رابط" })).toBeNull();
    expect(normalizeOffer({ purchaseUrl: "https://x.dev" })).toBeNull();
    expect(normalizeOffer({ title: "ok", purchaseUrl: "https://x.dev" })?.id).toBe("https://x.dev");
  });

  it("يقرأ المتاجر من حقل data", async () => {
    mockFetch({ data: [{ id: "s1", name: "متجر" }, { name: "بدون معرف" }] });
    const stores = await fetchHkeeemStores();
    expect(stores.map((s) => s.name)).toContain("متجر");
  });
});
