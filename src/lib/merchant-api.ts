import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Merchant = Database["public"]["Tables"]["merchants"]["Row"];
export type MerchantDeal = Database["public"]["Tables"]["merchant_deals"]["Row"];
export type MerchantStatus = Database["public"]["Enums"]["merchant_status"];
export type DealStatus = Database["public"]["Enums"]["deal_status"];

export const MERCHANT_STATUS_LABEL: Record<MerchantStatus, string> = {
  pending: "قيد المراجعة",
  verified: "موثّق",
  rejected: "مرفوض",
  suspended: "موقوف",
};

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  draft: "مسودة",
  pending: "بانتظار المراجعة",
  published: "منشور",
  rejected: "مرفوض",
  expired: "منتهي",
};

export const MERCHANT_CATEGORIES = [
  "سوبرماركت",
  "مطاعم",
  "إلكترونيات",
  "أزياء",
  "صيدلية",
  "عقار",
  "سيارات",
  "أخرى",
];

export function slugify(name: string) {
  const base = name.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `${base || "store"}-${Math.random().toString(36).slice(2, 7)}`;
}

/** متجري (التاجر الحالي) */
export async function fetchMyMerchant(userId: string): Promise<Merchant | null> {
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMerchant(input: {
  owner_id: string;
  name: string;
  description?: string;
  category: string;
  city?: string;
  cr_number?: string;
  website?: string;
  phone?: string;
  logo_url?: string;
}) {
  const { data, error } = await supabase
    .from("merchants")
    .insert({ ...input, slug: slugify(input.name), status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMerchant(id: string, patch: Partial<Merchant>) {
  const { error } = await supabase.from("merchants").update(patch).eq("id", id);
  if (error) throw error;
}

/** عروض متجري بكل الحالات */
export async function fetchMerchantDeals(merchantId: string) {
  const { data, error } = await supabase
    .from("merchant_deals")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDeal(input: {
  merchant_id: string;
  title: string;
  description?: string;
  image_url?: string;
  category: string;
  unit?: string;
  original_price: number;
  price: number;
  product_url?: string;
  coupon_code?: string;
  expires_at?: string | null;
  submit: boolean;
}) {
  const { submit, ...rest } = input;
  const { error } = await supabase
    .from("merchant_deals")
    .insert({ ...rest, status: submit ? "pending" : "draft" });
  if (error) throw error;
}

export async function updateDeal(id: string, patch: Partial<MerchantDeal>) {
  const { error } = await supabase.from("merchant_deals").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteDeal(id: string) {
  const { error } = await supabase.from("merchant_deals").delete().eq("id", id);
  if (error) throw error;
}

/** العروض الحقيقية المنشورة (قراءة عامة) */
export async function fetchPublishedDeals(limit = 60) {
  const { data, error } = await supabase
    .from("merchant_deals")
    .select("*, merchants!inner(id,name,logo_url,city,slug)")
    .eq("status", "published")
    .order("discount_percent", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as (MerchantDeal & {
    merchants: { id: string; name: string; logo_url: string | null; city: string | null; slug: string };
  })[];
}

/** مراجعة الإدارة */
export async function staffListMerchants() {
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function staffListDeals() {
  const { data, error } = await supabase
    .from("merchant_deals")
    .select("*, merchants(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as (MerchantDeal & { merchants: { name: string } | null })[];
}
