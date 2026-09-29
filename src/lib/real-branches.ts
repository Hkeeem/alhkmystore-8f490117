import { supabase } from "@/integrations/supabase/client";

export type RealBranch = {
  id: string;
  store_id: string;
  store_name: string;
  name: string;
  city: string;
  district: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  balady_url: string | null;
  maps_url: string | null;
  notes: string | null;
};

/** فروع حكيم الحقيقية المحفوظة في قاعدة البيانات (قراءة عامة) */
export async function fetchRealBranches(): Promise<RealBranch[]> {
  const { data, error } = await supabase
    .from("store_branches")
    .select(
      "id,store_id,store_name,name,city,district,address,lat,lng,phone,whatsapp,hours,balady_url,maps_url,notes",
    )
    .eq("is_active", true)
    .order("city", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RealBranch[];
}

export function directionsUrl(b: { lat: number; lng: number; maps_url?: string | null }) {
  return (
    b.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`
  );
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function waHref(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "966");
  return `https://wa.me/${digits}`;
}
