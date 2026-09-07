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
      productKey: row.product_key ?? undefined,
      verifiedAt: row.fetched_at ?? row.updated_at ?? undefined,
      source: row.store_name ?? row.source ?? undefined,
    });
  }

  return list;
}
