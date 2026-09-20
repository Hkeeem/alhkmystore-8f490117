import { createClient } from "@supabase/supabase-js";
import type { Category, Deal } from "@/data/deals";
import type { LiveCoupon } from "@/lib/coupons-api";

/**
 * مصدر خارجي إضافي (قاعدة بيانات المستخدم الخارجية).
 * يُدمج مع بيانات القاعدة الحالية ولا يستبدلها.
 * أي فشل في الاتصال يُتجاهل بصمت حتى لا تتأثر الشاشات.
 */
const EXTERNAL_URL = "https://pcycuavbjpqvfuwwqlso.supabase.co";
const EXTERNAL_KEY = "sb_publishable_LskONEge1dGvy5o6G4YYXg_uAjO3Owr";

export const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      h.set("apikey", EXTERNAL_KEY);
      return fetch(input, { ...init, headers: h });
    },
  },
});

const KNOWN_CATEGORIES: Category[] = ["سوبرماركت", "مطاعم", "إلكترونيات", "أزياء", "صيدلية"];

function toCategory(value: unknown): Category {
  const v = typeof value === "string" ? value.trim() : "";
  return (KNOWN_CATEGORIES as string[]).includes(v) ? (v as Category) : "سوبرماركت";
}

function expiresLabel(expiresAt: string | null | undefined) {
  if (!expiresAt) return "غير محدد";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return "غير محدد";
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "يوم";
  if (days === 2) return "يومان";
  if (days <= 7) return `${days} أيام`;
  if (days <= 14) return "أسبوعان";
  return `${Math.ceil(days / 7)} أسابيع`;
}

type ExternalStore = { id: string; name: string | null; name_ar: string | null; website_url: string | null };

let storeCache: { at: number; map: Map<string, ExternalStore> } | null = null;

async function loadStores(): Promise<Map<string, ExternalStore>> {
  if (storeCache && Date.now() - storeCache.at < 300_000) return storeCache.map;
  const map = new Map<string, ExternalStore>();
  try {
    const { data } = await externalSupabase.from("stores").select("id,name,name_ar,website_url");
    for (const row of (data ?? []) as ExternalStore[]) map.set(row.id, row);
  } catch {
    /* تجاهل */
  }
  storeCache = { at: Date.now(), map };
  return map;
}

/** عروض حية من المصدر الخارجي، مُحوّلة إلى شكل العروض في التطبيق */
export async function fetchExternalSourceDeals(limit = 60): Promise<Deal[]> {
  try {
    const [{ data }, storeMap] = await Promise.all([
      externalSupabase
        .from("offers")
        .select(
          "id,title,description,original_price,current_price,discount_percent,image_url,product_url,store_id,category,status,expires_at,created_at,updated_at",
        )
        .eq("status", "active")
        .order("discount_percent", { ascending: false })
        .limit(limit),
      loadStores(),
    ]);

    return ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const store = storeMap.get(String(row["store_id"] ?? ""));
      const storeName = store?.name_ar || store?.name || "متجر";
      const price = Number(row["current_price"] ?? 0);
      const original = Number(row["original_price"] ?? price);
      return {
        id: `ext-${String(row["id"])}`,
        title: String(row["title"] ?? ""),
        storeId: (store?.name ?? "external").toLowerCase(),
        category: toCategory(row["category"]),
        originalPrice: original,
        price,
        image: (row["image_url"] as string) ?? "🏷️",
        expiresIn: expiresLabel(row["expires_at"] as string | null),
        expiresAt: (row["expires_at"] as string) ?? undefined,
        verifiedAt: (row["updated_at"] as string) ?? (row["created_at"] as string) ?? undefined,
        source: storeName,
        productUrl: (row["product_url"] as string) ?? store?.website_url ?? undefined,
      } satisfies Deal;
    });
  } catch {
    return [];
  }
}

/** عرض واحد من المصدر الخارجي بالمعرّف (بدون البادئة ext-) */
export async function fetchExternalSourceDealById(rawId: string): Promise<Deal | null> {
  const id = rawId.startsWith("ext-") ? rawId.slice(4) : rawId;
  try {
    const [{ data }, storeMap] = await Promise.all([
      externalSupabase
        .from("offers")
        .select(
          "id,title,description,original_price,current_price,discount_percent,image_url,product_url,store_id,category,status,expires_at,created_at,updated_at",
        )
        .eq("id", id)
        .maybeSingle(),
      loadStores(),
    ]);
    if (!data) return null;
    const row = data as Record<string, unknown>;
    const store = storeMap.get(String(row["store_id"] ?? ""));
    const storeName = store?.name_ar || store?.name || "متجر";
    const price = Number(row["current_price"] ?? 0);
    const original = Number(row["original_price"] ?? price);
    return {
      id: `ext-${String(row["id"])}`,
      title: String(row["title"] ?? ""),
      storeId: (store?.name ?? "external").toLowerCase(),
      category: toCategory(row["category"]),
      originalPrice: original,
      price,
      image: (row["image_url"] as string) ?? "🏷️",
      expiresIn: expiresLabel(row["expires_at"] as string | null),
      expiresAt: (row["expires_at"] as string) ?? undefined,
      verifiedAt: (row["updated_at"] as string) ?? (row["created_at"] as string) ?? undefined,
      source: storeName,
      productUrl: (row["product_url"] as string) ?? store?.website_url ?? undefined,
    } satisfies Deal;
  } catch {
    return null;
  }
}

/** كوبونات حية من المصدر الخارجي */
export async function fetchExternalSourceCoupons(limit = 60): Promise<LiveCoupon[]> {
  try {
    const [{ data }, storeMap] = await Promise.all([
      externalSupabase
        .from("coupons")
        .select("id,code,description,discount_value,store_id,store_url,status,expires_at,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit),
      loadStores(),
    ]);

    return ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const store = storeMap.get(String(row["store_id"] ?? ""));
      const storeName = store?.name_ar || store?.name || "متجر";
      const value = Number(row["discount_value"] ?? 0);
      return {
        id: `ext-${String(row["id"])}`,
        code: String(row["code"] ?? ""),
        title: `كود خصم ${storeName}`,
        description: (row["description"] as string) ?? `كود خصم من ${storeName}`,
        discount: value > 0 ? `${Math.round(value)}%` : "خصم",
        expiresIn: expiresLabel(row["expires_at"] as string | null),
        expiresAt: (row["expires_at"] as string) ?? undefined,
        storeName,
        storeUrl: (row["store_url"] as string) ?? store?.website_url ?? undefined,
        source: "مصدر خارجي",
      } satisfies LiveCoupon;
    });
  } catch {
    return [];
  }
}
