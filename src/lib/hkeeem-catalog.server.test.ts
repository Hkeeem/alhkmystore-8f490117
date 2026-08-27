import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchHkeeemCatalog, __resetCatalogCache, normalizeOffer, normalizeStore } from "./hkeeem-catalog.server";

const KEY = "test-build-secret-key";

beforeEach(() => {
  process.env["HKEEEM_INTEGRATION_KEY"] = KEY;
  __resetCatalogCache();
  vi.restoreAllMocks();
});

function mockRoutes(handler: (url: string) => { ok: boolean; status?: number; body?: unknown }) {
  const spy = vi.fn(async (input: unknown) => {
    const url = String(input);
    const r = handler(url);
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      json: async () => r.body,
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

const OFFERS = { data: { offers: [{ id: "o1", title: "عرض", purchaseUrl: "https://x.dev", storeId: "s1", price: 10, originalPrice: 20, discount: 50 }] } };
const STORES = { data: { stores: [{ id: "s1", name: "نون", website: "https://noon.com", category: "تسوق" }] } };

describe("كتالوج HkeeemAI الخادمي", () => {
  it("يجلب العروض والمتاجر ويرسل ترويسة التكامل من الخادم فقط", async () => {
    const spy = mockRoutes((url) => ({ ok: true, body: url.includes("/offers") ? OFFERS : STORES }));
    const catalog = await fetchHkeeemCatalog(24);
    expect(catalog.offers[0]?.title).toBe("عرض");
    expect(catalog.stores[0]?.name).toBe("نون");
    expect(catalog.stale).toBe(false);
    const init = spy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["X-Hkeeem-Integration-Key"]).toBe(KEY);
  });

  it("يعيد آخر نسخة ناجحة مع stale عند فشل المصدر", async () => {
    mockRoutes((url) => ({ ok: true, body: url.includes("/offers") ? OFFERS : STORES }));
    await fetchHkeeemCatalog();
    vi.setSystemTime?.(new Date());
    mockRoutes(() => ({ ok: false, status: 500 }));
    // تجاوز نافذة الـ ٦٠ ثانية
    const realNow = Date.now;
    Date.now = () => realNow() + 120_000;
    try {
      const stale = await fetchHkeeemCatalog();
      expect(stale.stale).toBe(true);
      expect(stale.offers).toHaveLength(1);
      expect(typeof stale.lastUpdatedAt).toBe("string");
    } finally {
      Date.now = realNow;
    }
  });

  it("يعرض رسالة عامة دون كشف السبب أو السر عند غياب كاش", async () => {
    mockRoutes(() => ({ ok: false, status: 500 }));
    await expect(fetchHkeeemCatalog()).rejects.toThrow("تعذر تحديث عروض حكيم حاليًا، حاول لاحقًا.");
    try {
      await fetchHkeeemCatalog();
    } catch (e) {
      expect(String((e as Error).message)).not.toContain(KEY);
    }
  });

  it("يعيد قائمة فارغة عندما لا توجد عروض", async () => {
    mockRoutes((url) => ({ ok: true, body: url.includes("/offers") ? { data: { offers: [] } } : STORES }));
    const catalog = await fetchHkeeemCatalog();
    expect(catalog.offers).toEqual([]);
  });

  it("يتجاهل السجلات الناقصة", () => {
    expect(normalizeOffer({})).toBeNull();
    expect(normalizeStore({ description: "بدون اسم" })).toBeNull();
  });
});
