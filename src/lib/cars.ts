import { supabase } from "@/integrations/supabase/client";

export type CarListing = {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  year: number;
  city: string;
  price: number;
  originalPrice: number | null;
  mileageKm: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  condition: string;
  seats: number;
  color: string | null;
  dealer: string | null;
  phone: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  features: string[];
};

export type CarFilters = {
  city?: string;
  brand?: string;
  bodyType?: string;
  transmission?: string;
  fuel?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "newest";
};

type Row = {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  year: number;
  city: string;
  price: number | string;
  original_price: number | string | null;
  mileage_km: number;
  fuel: string;
  transmission: string;
  body_type: string;
  condition: string;
  seats: number;
  color: string | null;
  dealer: string | null;
  phone: string | null;
  image_url: string | null;
  link_url: string | null;
  features: string[] | null;
};

function toCar(row: Row): CarListing {
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    year: row.year,
    city: row.city,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    mileageKm: row.mileage_km,
    fuel: row.fuel,
    transmission: row.transmission,
    bodyType: row.body_type,
    condition: row.condition,
    seats: row.seats,
    color: row.color,
    dealer: row.dealer,
    phone: row.phone,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    features: row.features ?? [],
  };
}

const COLUMNS =
  "id,title,brand,model,year,city,price,original_price,mileage_km,fuel,transmission,body_type,condition,seats,color,dealer,phone,image_url,link_url,features";

/** يجلب السيارات مع فلاتر السعر والمواصفات والمدينة */
export async function fetchCars(filters: CarFilters = {}, limit = 60): Promise<CarListing[]> {
  let q = supabase.from("car_listings").select(COLUMNS).eq("active", true).limit(limit);

  if (filters.city) q = q.eq("city", filters.city);
  if (filters.brand) q = q.eq("brand", filters.brand);
  if (filters.bodyType) q = q.eq("body_type", filters.bodyType);
  if (filters.transmission) q = q.eq("transmission", filters.transmission);
  if (filters.fuel) q = q.eq("fuel", filters.fuel);
  if (filters.condition) q = q.eq("condition", filters.condition);
  if (typeof filters.minPrice === "number") q = q.gte("price", filters.minPrice);
  if (typeof filters.maxPrice === "number") q = q.lte("price", filters.maxPrice);

  if (filters.sort === "price-desc") q = q.order("price", { ascending: false });
  else if (filters.sort === "newest") q = q.order("year", { ascending: false });
  else q = q.order("price", { ascending: true });

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as unknown as Row[]).map(toCar);
}

export async function fetchCarById(id: string): Promise<CarListing | null> {
  const { data, error } = await supabase
    .from("car_listings")
    .select(COLUMNS)
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return toCar(data as unknown as Row);
}

export function formatSar(v: number) {
  return `${v.toLocaleString("ar-SA")} ر.س`;
}
