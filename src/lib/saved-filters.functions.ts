import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * الفلاتر المفضّلة لكل مشرف — محمية بصلاحيات الدور (فريق الإدارة فقط)،
 * وكل مشرف يرى فلاتره هو فقط (RLS + فحص is_staff على الخادم).
 */

export type SavedFilter = {
  id: string;
  scope: string;
  name: string;
  filters: { days: number; country: string; referrer: string };
  is_default: boolean;
};

type Ctx = {
  supabase: {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
    from: (t: string) => any;
  };
  userId: string;
};

async function assertStaff(context: Ctx) {
  const { data } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("forbidden");
}

const normalizeFilters = (raw: unknown) => {
  const f = (raw ?? {}) as Record<string, unknown>;
  const days = Number(f["days"]);
  return {
    days: Number.isFinite(days) && days > 0 ? Math.min(365, Math.floor(days)) : 30,
    country: typeof f["country"] === "string" ? f["country"].slice(0, 16) : "",
    referrer: typeof f["referrer"] === "string" ? f["referrer"].slice(0, 200) : "",
  };
};

const parseScope = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 40) : "clicks";

export const listSavedFilters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { scope?: string }) => ({ scope: parseScope(data?.scope) }))
  .handler(async ({ context, data }): Promise<Array<SavedFilter>> => {
    await assertStaff(context as unknown as Ctx);
    const { data: rows, error } = await context.supabase
      .from("admin_saved_filters")
      .select("id, scope, name, filters, is_default")
      .eq("scope", data.scope)
      .order("is_default", { ascending: false })
      .order("created_at");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      scope: r.scope as string,
      name: r.name as string,
      filters: normalizeFilters(r.filters),
      is_default: !!r.is_default,
    }));
  });

export const saveFilter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { scope?: string; name: string; filters: unknown; isDefault?: boolean }) => {
      const name = String(data?.name ?? "")
        .trim()
        .slice(0, 60);
      if (!name) throw new Error("اسم الفلتر مطلوب");
      return {
        scope: parseScope(data?.scope),
        name,
        filters: normalizeFilters(data?.filters),
        isDefault: !!data?.isDefault,
      };
    },
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    if (data.isDefault) {
      await context.supabase
        .from("admin_saved_filters")
        .update({ is_default: false })
        .eq("user_id", context.userId)
        .eq("scope", data.scope);
    }
    const { error } = await context.supabase.from("admin_saved_filters").upsert(
      {
        user_id: context.userId,
        scope: data.scope,
        name: data.name,
        filters: data.filters,
        is_default: data.isDefault,
      },
      { onConflict: "user_id,scope,name" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setDefaultFilter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; scope?: string }) => ({
    id: String(data.id),
    scope: parseScope(data?.scope),
  }))
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    await context.supabase
      .from("admin_saved_filters")
      .update({ is_default: false })
      .eq("user_id", context.userId)
      .eq("scope", data.scope);
    const { error } = await context.supabase
      .from("admin_saved_filters")
      .update({ is_default: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedFilter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { error } = await context.supabase
      .from("admin_saved_filters")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
