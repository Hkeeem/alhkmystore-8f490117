import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedSupabase } from "@/integrations/supabase/client";

const supabase = typedSupabase as unknown as SupabaseClient;

/** جلب المنتجات والأسعار مع ضريبة القيمة المضافة 15% وتفاصيل المتاجر */
export async function fetchStorePrices() {
  const { data, error } = await supabase
    .from("store_product_prices")
    .select(`
      id,
      price_before_tax,
      price_with_tax,
      updated_at,
      stores (id, name_ar, logo_url),
      products (id, name_ar, unit)
    `);

  if (error) throw error;
  return data ?? [];
}

/** جلب الكوبونات النشطة والفعالة لكل متجر */
export async function fetchActiveCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select(`
      id,
      code,
      discount_type,
      discount_value,
      min_spend,
      expiry_date,
      stores (id, name_ar, logo_url)
    `)
    .eq("is_active", true);

  if (error) throw error;
  return data ?? [];
}
