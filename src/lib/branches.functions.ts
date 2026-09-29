import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

export type BranchInput = {
  id?: string | null;
  store_id: string;
  store_name: string;
  name: string;
  city: string;
  district?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  whatsapp?: string | null;
  hours?: string | null;
  balady_url?: string | null;
  maps_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

function clean(input: BranchInput) {
  const text = (v: unknown, max = 200) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const url = (v: unknown) => {
    const s = text(v, 500);
    if (s && !/^https?:\/\//i.test(s)) throw new Error("الرابط يجب أن يبدأ بـ http");
    return s;
  };
  const name = text(input.name);
  const city = text(input.city, 60);
  const storeId = text(input.store_id, 60);
  const storeName = text(input.store_name, 80);
  if (!name) throw new Error("اسم الفرع مطلوب");
  if (!city) throw new Error("المدينة مطلوبة");
  if (!storeId || !storeName) throw new Error("المتجر مطلوب");
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!Number.isFinite(lat) || lat < 15 || lat > 33) throw new Error("خط العرض غير صالح");
  if (!Number.isFinite(lng) || lng < 34 || lng > 56) throw new Error("خط الطول غير صالح");
  return {
    store_id: storeId,
    store_name: storeName,
    name,
    city,
    district: text(input.district, 80),
    address: text(input.address, 300),
    lat,
    lng,
    phone: text(input.phone, 30),
    whatsapp: text(input.whatsapp, 30),
    hours: text(input.hours, 300),
    balady_url: url(input.balady_url),
    maps_url: url(input.maps_url),
    notes: text(input.notes, 500),
    is_active: input.is_active !== false,
  };
}

export const listAllBranches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { data, error } = await context.supabase
      .from("store_branches")
      .select("*")
      .order("city", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: BranchInput) => ({ id: input.id || null, values: clean(input) }))
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    if (data.id) {
      const { error } = await context.supabase
        .from("store_branches")
        .update({ ...data.values, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("store_branches")
      .insert(data.values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("معرّف الفرع مطلوب");
    return { id: input.id };
  })
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase.from("store_branches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
