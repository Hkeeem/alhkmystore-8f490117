import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminCoupon = {
  id: string;
  store_name: string;
  store_id: string | null;
  code: string;
  title: string;
  description: string;
  discount: string;
  min_order: number | null;
  category: string | null;
  expires_at: string | null;
  source: string;
  active: boolean;
  created_at: string;
};

export type CouponInput = {
  id?: string;
  store_name: string;
  store_id?: string | null;
  code: string;
  title: string;
  description: string;
  discount: string;
  min_order?: number | null;
  category?: string | null;
  expires_at?: string | null;
  active?: boolean;
};

function parseInput(data: unknown): CouponInput {
  const d = (data ?? {}) as Record<string, unknown>;
  const str = (k: string) => String(d[k] ?? "").trim();
  const store_name = str("store_name");
  const code = str("code");
  const title = str("title");
  const discount = str("discount");
  if (!store_name || !code || !title || !discount) {
    throw new Error("الرجاء تعبئة المتجر والكود والعنوان وقيمة الخصم");
  }
  const minOrder = d["min_order"];
  return {
    ...(d["id"] ? { id: String(d["id"]) } : {}),
    store_name: store_name.slice(0, 120),
    store_id: str("store_id").slice(0, 80) || null,
    code: code.slice(0, 60).toUpperCase(),
    title: title.slice(0, 160),
    description: str("description").slice(0, 400) || title.slice(0, 160),
    discount: discount.slice(0, 40),
    min_order:
      minOrder === "" || minOrder === null || minOrder === undefined ? null : Number(minOrder),
    category: str("category").slice(0, 60) || null,
    expires_at: str("expires_at") ? new Date(str("expires_at")).toISOString() : null,
    active: d["active"] === undefined ? true : Boolean(d["active"]),
  };
}

async function assertStaff(context: { supabase: { rpc: Function }; userId: string }) {
  const { data } = await (context.supabase.rpc as (n: string, a: unknown) => Promise<{ data: unknown }>)(
    "is_staff",
    { _user_id: context.userId },
  );
  if (!data) throw new Error("forbidden");
}

/** قائمة الكوبونات لفريق العمل (تشمل غير النشطة). */
export const adminListCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { data, error } = await context.supabase
      .from("coupons")
      .select(
        "id, store_name, store_id, code, title, description, discount, min_order, category, expires_at, source, active, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminCoupon[];
  });

/** إضافة أو تعديل كوبون. */
export const adminSaveCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseInput)
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("coupons").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await context.supabase
      .from("coupons")
      .insert({ ...fields, source: "partner" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row?.id as string };
  });

/** تفعيل/إيقاف كوبون. */
export const adminToggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ({
    id: String((d as { id?: unknown })?.id ?? ""),
    active: Boolean((d as { active?: unknown })?.active),
  }))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** حذف كوبون. */
export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ({ id: String((d as { id?: unknown })?.id ?? "") }))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
