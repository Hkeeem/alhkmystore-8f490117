/**
 * تكامل خادمي فقط مع منصة HkeeemAI (v1).
 * المفتاح HKEEEM_INTEGRATION_KEY يُقرأ داخل الخادم ولا يُرسل أبداً للمتصفح ولا يُسجَّل.
 * لا توجد أي بيانات تجريبية أو متاجر وهمية — البيانات من الواجهة الرسمية فقط.
 */

const BASE = "https://hkeeemai-store.vercel.app/api/v1";
const TIMEOUT_MS = 8_000;
const FRESH_MS = 60_000;
const STALE_IF_ERROR_MS = 3_600_000;

export type CatalogOffer = {
  id: string;
  title: string;
  purchaseUrl: string | null;
  imageUrl: string | null;
  storeId: string | null;
  storeName: string | null;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  category: string | null;
  updatedAt: string | null;
};

export type CatalogStore = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
};

export type Catalog = {
  offers: CatalogOffer[];
  stores: CatalogStore[];
  lastUpdatedAt: string;
  stale: boolean;
};

type CacheEntry = { at: number; value: Omit<Catalog, "stale"> };
let cache: CacheEntry | null = null;

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pick(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null) return row[k];
  return null;
}

function rows(json: unknown, keys: string[]): unknown[] {
  const root = (json ?? {}) as Record<string, unknown>;
  const data = (root["data"] ?? root) as Record<string, unknown> | unknown[];
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    const v = (data as Record<string, unknown>)[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function normalizeOffer(raw: unknown): CatalogOffer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = str(pick(row, ["title", "name"]));
  if (!title) return null;
  const store = pick(row, ["store", "merchant"]) as Record<string, unknown> | null;
  return {
    id: str(pick(row, ["id", "offerId", "_id"])) ?? title,
    title,
    purchaseUrl: str(pick(row, ["purchaseUrl", "purchase_url", "url", "link"])),
    imageUrl: str(pick(row, ["imageUrl", "image_url", "image", "thumbnail"])),
    storeId:
      str(pick(row, ["storeId", "store_id"])) ??
      (store && typeof store === "object" ? str(store["id"]) : null),
    storeName:
      str(pick(row, ["storeName", "store_name"])) ??
      (store && typeof store === "object" ? str(store["name"]) : null),
    price: num(pick(row, ["price", "currentPrice", "current_price"])),
    originalPrice: num(pick(row, ["originalPrice", "original_price", "oldPrice"])),
    discountPercent: num(pick(row, ["discountPercent", "discount_percent", "discount"])),
    category: str(pick(row, ["category", "categoryName"])),
    updatedAt: str(pick(row, ["updatedAt", "updated_at", "lastUpdated"])),
  };
}

export function normalizeStore(raw: unknown): CatalogStore | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = str(pick(row, ["name", "storeName", "title"]));
  const id = str(pick(row, ["id", "storeId", "slug"])) ?? name;
  if (!name || !id) return null;
  return {
    id,
    name,
    description: str(pick(row, ["description", "about"])),
    category: str(pick(row, ["category", "categoryName"])),
    logoUrl: str(pick(row, ["logoUrl", "logo_url", "logo", "imageUrl"])),
    websiteUrl: str(pick(row, ["websiteUrl", "website_url", "website", "officialUrl", "url"])),
  };
}

class UpstreamError extends Error {
  constructor(
    public path: string,
    public status: number | null,
    message: string,
  ) {
    super(message);
  }
}

async function call(path: string): Promise<unknown> {
  const key = process.env["HKEEEM_INTEGRATION_KEY"];
  if (!key) throw new UpstreamError(path, null, "hkeeem-not-configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Hkeeem-Integration-Key": key, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      // سجل خادمي فقط، دون أي جزء من المفتاح
      console.error("[hkeeem] upstream error", { path, status: res.status });
      throw new UpstreamError(path, res.status, "hkeeem-upstream-error");
    }
    return await res.json();
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    throw new UpstreamError(path, null, "hkeeem-network-error");
  } finally {
    clearTimeout(timer);
  }
}

/** يعيد كتالوج حكيم (عروض + متاجر) مع كاش ٦٠ ثانية و stale-if-error حتى ساعة */
export async function fetchHkeeemCatalog(limit = 24): Promise<Catalog> {
  const now = Date.now();
  if (cache && now - cache.at < FRESH_MS) return { ...cache.value, stale: false };

  try {
    const [offersJson, storesJson] = await Promise.all([
      call(`/offers?limit=${encodeURIComponent(String(limit))}`),
      call(`/stores`),
    ]);

    const value = {
      offers: rows(offersJson, ["offers", "items", "results"])
        .map(normalizeOffer)
        .filter((o): o is CatalogOffer => o !== null),
      stores: rows(storesJson, ["stores", "items", "results"])
        .map(normalizeStore)
        .filter((s): s is CatalogStore => s !== null),
      lastUpdatedAt: new Date(now).toISOString(),
    };
    cache = { at: now, value };
    const { recordHkeeemSuccess } = await import("@/lib/hkeeem-alerts.server");
    void recordHkeeemSuccess(value.offers.length);
    return { ...value, stale: false };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown";
    const status = err instanceof UpstreamError ? err.status : null;
    const path = err instanceof UpstreamError ? err.path : "/offers";
    console.error("[hkeeem] catalog fetch failed", { reason, status });

    const { recordHkeeemFailure } = await import("@/lib/hkeeem-alerts.server");
    void recordHkeeemFailure({ path, status, reason });

    if (cache && now - cache.at < STALE_IF_ERROR_MS) {
      return { ...cache.value, stale: true };
    }
    // رسالة عامة فقط — لا تكشف السبب ولا أي جزء من السر
    throw new Error("تعذر تحديث عروض حكيم حاليًا، حاول لاحقًا.");
  }
}

/** لأغراض الاختبار فقط */
export function __resetCatalogCache() {
  cache = null;
}
