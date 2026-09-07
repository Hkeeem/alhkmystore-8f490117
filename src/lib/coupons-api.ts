import { supabase } from "@/integrations/supabase/client";
import { stores } from "@/data/deals";

/**
 * مصدر موحّد للكوبونات الحقيقية:
 * - جدول coupons (أكواد موثّقة مفعّلة)
 * - عروض التجّار المنشورة التي تحتوي على كود خصم
 * لا توجد أي بيانات تجريبية هنا.
 */
export type LiveCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  minOrder?: number;
  expiresIn: string;
  expiresAt?: string;
  category?: string;
  storeId?: string;
  storeName: string;
  logo?: string;
  color?: string;
  storeUrl?: string;
  imageUrl?: string;
  originalPrice?: number;
  price?: number;
  source: string;
};

/** روابط ترويجية مباشرة للمتاجر (بدون مزامنة تلقائية) */
const STORE_LINKS: Record<string, string> = {
  noon: "https://www.noon.com/saudi-ar/",
  amazon: "https://www.amazon.sa/",
};

/** معرّف الناشر العام (كود الخصم) الذي يُمرَّر مع كل رابط ترويجي */
export const PUBLISHER_TAG = "HKM11";

/** يضيف وسوم التتبع وكود الخصم إلى أي رابط متجر */
export function withPromo(url: string | undefined, code?: string) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "hkeeem");
    u.searchParams.set("utm_medium", "affiliate");
    u.searchParams.set("utm_campaign", PUBLISHER_TAG);
    if (code) u.searchParams.set("coupon", code);
    return u.toString();
  } catch {
    return url;
  }
}

function storeLink(storeId?: string | null) {
  if (!storeId) return undefined;
  return STORE_LINKS[storeId.trim().toLowerCase()];
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

function storeMeta(storeId?: string | null) {
  if (!storeId) return undefined;
  return stores.find((s) => s.id === storeId.trim().toLowerCase());
}

function discountLabel(original: number, price: number) {
  if (!(original > 0) || !(price >= 0) || price >= original) return "خصم";
  const pct = Math.round(((original - price) / original) * 100);
  return `${pct}%`;
}

export async function fetchLiveCoupons(limit = 120): Promise<LiveCoupon[]> {
  const [couponsRes, dealsRes] = await Promise.all([
    supabase
      .from("coupons")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("merchant_deals")
      .select("*, merchants!inner(id,name,slug,logo_url)")
      .eq("status", "published")
      .not("coupon_code", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const list: LiveCoupon[] = [];

  for (const row of couponsRes.data ?? []) {
    const meta = storeMeta(row.store_id);
    list.push({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      discount: row.discount,
      minOrder: row.min_order != null ? Number(row.min_order) : undefined,
      expiresIn: expiresLabel(row.expires_at),
      expiresAt: row.expires_at ?? undefined,
      category: row.category ?? undefined,
      storeId: row.store_id ?? undefined,
      storeName: row.store_name || meta?.name || "متجر",
      logo: meta?.logo,
      color: meta?.color,
      storeUrl: withPromo(storeLink(row.store_id), row.code),
      source: row.source,
    });

  }

  for (const row of dealsRes.data ?? []) {
    const code = (row as { coupon_code?: string | null }).coupon_code;
    if (!code) continue;
    const merchant = (row as { merchants?: { name?: string; slug?: string } }).merchants;
    const meta = storeMeta(merchant?.slug);
    list.push({
      id: row.id,
      code,
      title: row.title,
      description: row.description ?? `كود خصم من ${merchant?.name ?? "تاجر موثّق"}`,
      discount: discountLabel(Number(row.original_price), Number(row.price)),
      expiresIn: expiresLabel(row.expires_at),
      expiresAt: row.expires_at ?? undefined,
      category: "حصري",
      storeId: merchant?.slug,
      storeName: merchant?.name ?? "تاجر موثّق",
      logo: meta?.logo,
      color: meta?.color,
      storeUrl: withPromo(
        (row as { product_url?: string | null }).product_url ?? storeLink(merchant?.slug),
        code,
      ),
      imageUrl: (row as { image_url?: string | null }).image_url ?? undefined,
      originalPrice: Number(row.original_price) || undefined,
      price: Number(row.price) || undefined,
      source: "تاجر موثّق",

    });
  }

  return list;
}
