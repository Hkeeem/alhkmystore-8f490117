import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Category, type Deal, registerStore, setDeals } from "@/data/deals";

const CATEGORIES: Category[] = ["سوبرماركت", "مطاعم", "إلكترونيات", "أزياء", "صيدلية"];

export function normalizeCategory(value: string | null | undefined): Category {
  const found = CATEGORIES.find((c) => c === value);
  return found ?? "سوبرماركت";
}

export function expiresLabel(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "لفترة محدودة";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return "لفترة محدودة";
  if (ms <= 0) return "منتهي";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return hours <= 1 ? "أقل من ساعة" : `${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days === 1) return "يوم واحد";
  if (days === 2) return "يومان";
  if (days < 7) return `${days} أيام`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "أسبوع" : weeks === 2 ? "أسبوعان" : `${weeks} أسابيع`;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=300&q=80";

/** جلب كل العروض الحقيقية: عروض التجّار المنشورة + العروض المسحوبة/المستوردة */
export async function fetchRealDeals(): Promise<Deal[]> {
  const [external, merchant] = await Promise.all([
    supabase
      .from("external_deals")
      .select("*")
      .eq("active", true)
      .order("discount_percent", { ascending: false })
      .limit(200),
    supabase
      .from("merchant_deals")
      .select("*, merchants!inner(id,name,logo_url,city,slug)")
      .eq("status", "published")
      .order("discount_percent", { ascending: false })
      .limit(200),
  ]);

  const out: Deal[] = [];

  for (const row of external.data ?? []) {
    if (row.store_name) {
      registerStore({
        id: row.store_id,
        name: row.store_name,
        logo: row.store_name.slice(0, 1),
        color: "oklch(0.72 0.13 85)",
        category: normalizeCategory(row.category),
      });
    }
    out.push({
      id: `x_${row.id}`,
      title: row.title,
      brand: row.brand ?? undefined,
      storeId: row.store_id,
      category: normalizeCategory(row.category),
      originalPrice: Number(row.original_price),
      price: Number(row.price),
      unit: row.unit ?? undefined,
      image: row.image_url || FALLBACK_IMAGE,
      tags: row.source === "manual" ? undefined : ["عرض حقيقي"],
      expiresIn: expiresLabel(row.expires_at),
      productKey: row.product_key ?? undefined,
      productUrl: row.product_url ?? undefined,
    });
  }

  for (const row of merchant.data ?? []) {
    const m = row.merchants;
    const storeId = `m_${m.id}`;
    registerStore({
      id: storeId,
      name: m.name,
      logo: m.name.slice(0, 1),
      logoUrl: m.logo_url ?? undefined,
      color: "oklch(0.72 0.13 85)",
      category: normalizeCategory(row.category),
    });
    out.push({
      id: `m_${row.id}`,
      title: row.title,
      storeId,
      category: normalizeCategory(row.category),
      originalPrice: Number(row.original_price),
      price: Number(row.price),
      unit: row.unit ?? undefined,
      image: row.image_url || FALLBACK_IMAGE,
      tags: ["تاجر موثّق"],
      expiresIn: expiresLabel(row.expires_at),
      productUrl: row.product_url ?? undefined,
    });
  }

  return out.sort((a, b) => {
    const da = a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
    const db = b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
    return db - da;
  });
}

export const realDealsQueryKey = ["real-deals"] as const;

/** تحميل العروض الحقيقية ومزامنتها مع مخزن `deals` المشترك */
export function useRealDeals() {
  const query = useQuery({
    queryKey: realDealsQueryKey,
    queryFn: fetchRealDeals,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) setDeals(query.data);
  }, [query.data]);

  return {
    deals: query.data ?? [],
    isLoading: query.isLoading,
    isEmpty: !query.isLoading && (query.data?.length ?? 0) === 0,
    error: query.error,
    refetch: query.refetch,
  };
}
