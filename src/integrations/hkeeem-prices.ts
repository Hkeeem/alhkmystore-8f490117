import { supabase } from "@/integrations/supabase/client";

export type StorePriceRow = {
  id: string;
  store_id: string;
  price_before_tax: number;
  price_with_tax: number;
  updated_at: string;
  products: { name_ar: string } | null;
};

/** جلب المنتجات والأسعار (السعر النهائي شامل ضريبة القيمة المضافة 15%) */
export async function fetchStorePrices(): Promise<StorePriceRow[]> {
  const { data, error } = await supabase
    .from("external_deals")
    .select("id, title, store_id, store_name, price, updated_at")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id,
    store_id: d.store_id,
    price_before_tax: Math.round((d.price / 1.15) * 100) / 100,
    price_with_tax: d.price,
    updated_at: d.updated_at,
    products: { name_ar: d.title },
  }));
}

export type ActiveCouponRow = {
  id: string;
  code: string;
  discount_value: string;
  store_name: string | null;
};

/** جلب الكوبونات النشطة والفعالة لكل متجر */
export async function fetchActiveCoupons(): Promise<ActiveCouponRow[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount, store_name")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    discount_value: c.discount,
    store_name: c.store_name,
  }));
}
