/**
 * جلب عروض منصة HkeeemAI من الخادم فقط.
 * المفتاح HKEEEM_INTEGRATION_KEY لا يُرسل أبدًا إلى المتصفح ولا يُسجَّل.
 */

const BASE = "https://hkeeemai-platform.vercel.app/api/integration/offers";
const CACHE_TTL_MS = 5 * 60_000;

export type HkeeemOffer = {
  id: string;
  title: string;
  purchaseUrl: string;
  imageUrl: string | null;
  storeName: string | null;
  storeId: string | null;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  savingsScore: number | null;
  category: string | null;
  platform: string | null;
  sourceUrl: string | null;
  updatedAt: string | null;
};

export type HkeeemStore = { id: string; name: string };

export type HkeeemQuery = { category?: string; platform?: string; storeId?: string; minDiscount?: number };

type CacheEntry = { at: number; value: unknown };
const cache = new Map<string, CacheEntry>();

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function pick(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null) return row[k];
  return null;
}

async function callApi(params: Record<string, string>): Promise<unknown[]> {
  const key = process.env["HKEEEM_INTEGRATION_KEY"];
  if (!key) throw new Error("تكامل حكيم غير مُهيّأ.");

  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value as unknown[];

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-Hkeeem-Integration-Key": key, Accept: "application/json" },
    });
  } catch {
    throw new Error("تعذّر الاتصال بمنصة حكيم.");
  }

  if (!res.ok) {
    // سجل خادمي فقط، دون أي جزء من المفتاح
    console.error("[hkeeem] request failed", { status: res.status, path: url.pathname });
    if (res.status === 401 || res.status === 403) {
      throw new Error("لم تقبل منصة حكيم مفتاح التكامل الحالي.");
    }
    throw new Error(`تعذّر جلب البيانات من منصة حكيم (${res.status}).`);
  }

  const json = (await res.json().catch(() => null)) as { data?: unknown; error?: unknown } | null;
  if (!json) throw new Error("استجابة غير صالحة من منصة حكيم.");
  if (json.error) throw new Error("تعذّر جلب البيانات من منصة حكيم.");

  const data = Array.isArray(json.data)
    ? json.data
    : Array.isArray((json.data as { offers?: unknown[] } | undefined)?.offers)
      ? ((json.data as { offers: unknown[] }).offers)
      : [];

  cache.set(cacheKey, { at: Date.now(), value: data });
  return data;
}

export function normalizeOffer(raw: unknown): HkeeemOffer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = str(pick(row, ["title", "name", "offerTitle"]));
  const purchaseUrl = str(pick(row, ["purchaseUrl", "purchase_url", "url", "link"]));
  if (!title || !purchaseUrl) return null;

  const store = pick(row, ["store", "merchant"]) as Record<string, unknown> | null;
  return {
    id: str(pick(row, ["id", "offerId", "_id"])) ?? purchaseUrl,
    title,
    purchaseUrl,
    imageUrl: str(pick(row, ["imageUrl", "image_url", "image", "thumbnail"])),
    storeName:
      str(pick(row, ["storeName", "store_name", "merchantName"])) ??
      (store && typeof store === "object" ? str(store["name"]) : null),
    storeId:
      str(pick(row, ["storeId", "store_id"])) ??
      (store && typeof store === "object" ? str(store["id"]) : null),
    price: num(pick(row, ["price", "currentPrice", "current_price", "newPrice"])),
    originalPrice: num(pick(row, ["originalPrice", "original_price", "oldPrice", "previousPrice"])),
    discountPercent: num(pick(row, ["discountPercent", "discount_percent", "discount"])),
    savingsScore: num(pick(row, ["savingsScore", "savings_score", "score"])),
    category: str(pick(row, ["category", "categoryName"])),
    platform: str(pick(row, ["platform", "source"])),
  };
}

export async function fetchHkeeemOffers(query: HkeeemQuery): Promise<HkeeemOffer[]> {
  const rows = await callApi({
    category: query.category ?? "",
    platform: query.platform ?? "",
    storeId: query.storeId ?? "",
  });
  return rows.map(normalizeOffer).filter((o): o is HkeeemOffer => o !== null);
}

export async function fetchHkeeemStores(): Promise<HkeeemStore[]> {
  const rows = await callApi({ platform: "store" });
  const out: HkeeemStore[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const name = str(pick(row, ["name", "storeName", "store_name", "title"]));
    const id = str(pick(row, ["id", "storeId", "store_id"])) ?? name;
    if (name && id && !out.some((s) => s.id === id)) out.push({ id, name });
  }
  return out;
}
