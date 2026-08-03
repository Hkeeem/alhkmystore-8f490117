import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { CRAWL_SOURCES, crawlAllSources, type CrawlSourceId } from "@/lib/crawler.server";

export type ImportRow = {
  store_id: string;
  store_name: string;
  title: string;
  brand?: string;
  category: string;
  unit?: string;
  original_price: number;
  price: number;
  image_url?: string;
  product_url?: string;
  product_key?: string;
  expires_at?: string | null;
};

export async function assertStaff(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("is_staff", { _user_id: userId });
  if (error) throw new Error("تعذّر التحقق من الصلاحيات");
  if (!data) throw new Error("هذه العملية مخصّصة لفريق الإدارة");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function listExternalDealRows() {
  const db = await admin();
  const { data, error } = await db
    .from("external_deals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data ?? [];
}

export async function importExternalDealRows(rows: ImportRow[], userId: string) {
  const db = await admin();
  const payload = rows.map((r, i) => ({
    source: "manual",
    source_key: `${r.store_id}:${r.title.slice(0, 80)}:${Date.now()}_${i}`,
    store_id: r.store_id,
    store_name: r.store_name,
    title: r.title,
    brand: r.brand ?? null,
    category: r.category,
    unit: r.unit ?? null,
    original_price: r.original_price,
    price: r.price,
    discount_percent:
      r.original_price > r.price ? Math.round(((r.original_price - r.price) / r.original_price) * 100) : 0,
    image_url: r.image_url ?? null,
    product_url: r.product_url ?? null,
    product_key: r.product_key ?? null,
    expires_at: r.expires_at ?? null,
    active: true,
    created_by: userId,
  }));

  const { error } = await db.from("external_deals").insert(payload);
  if (error) throw error;
  return { inserted: payload.length };
}

export async function setExternalDealActive(id: string, active: boolean) {
  const db = await admin();
  const { error } = await db.from("external_deals").update({ active }).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function deleteExternalDealRow(id: string) {
  const db = await admin();
  const { error } = await db.from("external_deals").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function runCrawl(sources?: string[]) {
  const valid = CRAWL_SOURCES.map((s) => s.id);
  const only = sources?.filter((s): s is CrawlSourceId => valid.includes(s as CrawlSourceId));
  const results = await crawlAllSources(only && only.length > 0 ? only : undefined);
  return {
    results,
    total: results.reduce((sum, r) => sum + r.saved, 0),
  };
}
