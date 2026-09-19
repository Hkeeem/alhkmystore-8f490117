import { supabase } from "@/integrations/supabase/client";
import type { Category, Deal } from "@/data/deals";
import { stores } from "@/data/deals";

/**
 * مصدر موحّد للعروض الحقيقية: عروض التجّار المنشورة + العروض الخارجية النشطة.
 * لا تحتوي على أي بيانات تجريبية.
 */

const KNOWN_CATEGORIES: Category[] = ["سوبرماركت", "مطاعم", "إلكترونيات", "أزياء", "صيدلية"];

function toCategory(value: string | null | undefined): Category {
  const v = (value ?? "").trim();
  return (KNOWN_CATEGORIES as string[]).includes(v) ? (v as Category) : "سوبرماركت";
}

function toStoreId(candidate: string | null | undefined, fallback: string) {
  const v = (candidate ?? "").trim().toLowerCase();
  if (v && stores.some((s) => s.id === v)) return v;
  return fallback;
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

export async function fetchRealDeals(limit = 120): Promise<Deal[]> {
  const [merchantRes, externalRes] = await Promise.all([
    supabase
      .from("merchant_deals")
      .select("*, merchants!inner(id,name,logo_url,city,slug)")
      .eq("status", "published")
      .order("discount_percent", { ascending: false })
      .limit(limit),
    supabase
      .from("external_deals")
      .select("*")
      .eq("active", true)
      .order("discount_percent", { ascending: false })
      .limit(limit),
  ]);

  const list: Deal[] = [];

  for (const row of merchantRes.data ?? []) {
    const merchant = (row as { merchants?: { name?: string; slug?: string } }).merchants;
    list.push({
      id: row.id,
      title: row.title,
      storeId: toStoreId(merchant?.slug, merchant?.slug ?? "merchant"),
      category: toCategory(row.category),
      originalPrice: Number(row.original_price),
      price: Number(row.price),
      unit: row.unit ?? undefined,
      image: row.image_url ?? "🏷️",
      expiresIn: expiresLabel(row.expires_at),
      expiresAt: row.expires_at ?? undefined,
      verifiedAt: row.updated_at ?? row.created_at ?? undefined,
      source: merchant?.name ?? "تاجر موثّق",
      productUrl: row.product_url ?? undefined,
      couponCode: row.coupon_code ?? undefined,
    });
  }

  for (const row of externalRes.data ?? []) {
    list.push({
      id: row.id,
      title: row.title,
      brand: row.brand ?? undefined,
      storeId: toStoreId(row.store_id, row.store_id ?? "external"),
      category: toCategory(row.category),
      originalPrice: Number(row.original_price),
      price: Number(row.price),
      unit: row.unit ?? undefined,
      image: row.image_url ?? "🏷️",
      expiresIn: expiresLabel(row.expires_at),
      expiresAt: row.expires_at ?? undefined,
      productKey: row.product_key ?? undefined,
      verifiedAt: row.fetched_at ?? row.updated_at ?? undefined,
      source: row.store_name ?? row.source ?? undefined,
      productUrl: row.product_url ?? undefined,
    });
  }

  // دمج العروض الحية من المصدر الخارجي
  const externalSource = await fetchExternalSourceDeals(limit);
  for (const deal of externalSource) {
    if (!list.some((d) => d.id === deal.id)) list.push(deal);
  }

  return list;
}

/** جلب عرض حقيقي واحد بالمعرّف (تاجر موثّق أو مصدر خارجي مثل نون) */
export async function fetchRealDealById(id: string): Promise<Deal | null> {
  const [merchantRes, externalRes] = await Promise.all([
    supabase
      .from("merchant_deals")
      .select("*, merchants(id,name,logo_url,city,slug)")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle(),
    supabase.from("external_deals").select("*").eq("id", id).maybeSingle(),
  ]);

  const m = merchantRes.data;
  if (m) {
    const merchant = (m as { merchants?: { name?: string; slug?: string } }).merchants;
    return {
      id: m.id,
      title: m.title,
      storeId: toStoreId(merchant?.slug, merchant?.slug ?? "merchant"),
      category: toCategory(m.category),
      originalPrice: Number(m.original_price),
      price: Number(m.price),
      unit: m.unit ?? undefined,
      image: m.image_url ?? "🏷️",
      expiresIn: expiresLabel(m.expires_at),
      expiresAt: m.expires_at ?? undefined,
      verifiedAt: m.updated_at ?? m.created_at ?? undefined,
      source: merchant?.name ?? "تاجر موثّق",
      productUrl: m.product_url ?? undefined,
      couponCode: m.coupon_code ?? undefined,
    };
  }

  const e = externalRes.data;
  if (e) {
    return {
      id: e.id,
      title: e.title,
      brand: e.brand ?? undefined,
      storeId: toStoreId(e.store_id, e.store_id ?? "external"),
      category: toCategory(e.category),
      originalPrice: Number(e.original_price),
      price: Number(e.price),
      unit: e.unit ?? undefined,
      image: e.image_url ?? "🏷️",
      expiresIn: expiresLabel(e.expires_at),
      expiresAt: e.expires_at ?? undefined,
      productKey: e.product_key ?? undefined,
      verifiedAt: e.fetched_at ?? e.updated_at ?? undefined,
      source: e.store_name ?? e.source ?? undefined,
      productUrl: e.product_url ?? undefined,
    };
  }

  return null;
}
