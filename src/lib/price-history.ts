import { supabase } from "@/integrations/supabase/client";

export interface PricePoint {
  date: string;
  price: number;
}

/** يجلب سجل أسعار منتج خلال آخر 30 يومًا (قراءة عامة). */
export async function fetchPriceHistory(productId: string, days = 30): Promise<PricePoint[]> {
  if (!productId) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("price_history")
    .select("price, captured_at")
    .eq("product_id", productId)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    date: new Date(row.captured_at as string).toLocaleDateString("ar-SA", {
      day: "numeric",
      month: "short",
    }),
    price: Number(row.price),
  }));
}
