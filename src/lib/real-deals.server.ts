import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Deal } from "@/data/deals";
import { expiresLabel, normalizeCategory } from "@/lib/real-deals";

/** عميل قراءة عامة (مفتاح النشر) — يُستعمل داخل الدوال الخادمية فقط */
export function createPublicSupabase() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ServerDeal = Deal & { storeName: string };

/** العروض الحقيقية من قاعدة البيانات (للاستخدام في مسارات الذكاء الاصطناعي) */
export async function fetchRealDealsServer(limit = 150): Promise<ServerDeal[]> {
  const supabase = createPublicSupabase();

  const [external, merchant] = await Promise.all([
    supabase
      .from("external_deals")
      .select("*")
      .eq("active", true)
      .order("discount_percent", { ascending: false })
      .limit(limit),
    supabase
      .from("merchant_deals")
      .select("*, merchants!inner(id,name,logo_url,slug)")
      .eq("status", "published")
      .order("discount_percent", { ascending: false })
      .limit(limit),
  ]);

  const out: ServerDeal[] = [];

  for (const row of external.data ?? []) {
    out.push({
      id: `x_${row.id}`,
      title: row.title,
      brand: row.brand ?? undefined,
      storeId: row.store_id,
      storeName: row.store_name ?? row.store_id,
      category: normalizeCategory(row.category),
      originalPrice: Number(row.original_price),
      price: Number(row.price),
      unit: row.unit ?? undefined,
      image: row.image_url ?? "",
      expiresIn: expiresLabel(row.expires_at),
      productKey: row.product_key ?? undefined,
      productUrl: row.product_url ?? undefined,
    });
  }

  for (const row of merchant.data ?? []) {
    out.push({
      id: `m_${row.id}`,
      title: row.title,
      storeId: `m_${row.merchants.id}`,
      storeName: row.merchants.name,
      category: normalizeCategory(row.category),
      originalPrice: Number(row.original_price),
      price: Number(row.price),
      unit: row.unit ?? undefined,
      image: row.image_url ?? "",
      expiresIn: expiresLabel(row.expires_at),
      productUrl: row.product_url ?? undefined,
    });
  }

  return out;
}
