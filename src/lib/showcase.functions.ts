import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const showcaseInput = (value: unknown) => {
  const d = (value ?? {}) as { limit?: unknown };
  const limit = Number(d.limit);
  return { limit: Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 24 };
};

export const getShowroomOffers = createServerFn({ method: "GET" })
  .inputValidator(showcaseInput)
  .handler(async ({ data }) => {
    const { fetchShowroomOffers } = await import("@/lib/showcase");
    try {
      return await fetchShowroomOffers(data.limit);
    } catch {
      return [];
    }
  });

export const getOfficePicks = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => {
    const d = (value ?? {}) as { kind?: unknown; limit?: unknown };
    const kind: "developer" | "property" = d.kind === "developer" ? "developer" : "property";
    const limit = Number(d.limit);
    return {
      kind,
      limit: Number.isFinite(limit) ? Math.min(50, Math.max(1, Math.floor(limit))) : 12,
    };
  })
  .handler(async ({ data }) => {
    const { fetchOfficePicks } = await import("@/lib/showcase");
    try {
      return await fetchOfficePicks(data.kind, data.limit);
    } catch {
      return [];
    }
  });

export const adminListShowroomOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("showroom_offers")
      .select("*")
      .order("rank", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveShowroomOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => {
    const d = (value ?? {}) as Record<string, unknown>;
    const text = (key: string, max: number, required = false) => {
      const v = String(d[key] ?? "")
        .trim()
        .slice(0, max);
      if (required && !v) throw new Error(`${key}_required`);
      return v || null;
    };
    const numeric = (key: string) => {
      const v = Number(d[key]);
      return Number.isFinite(v) ? v : null;
    };
    return {
      id: text("id", 80),
      source_key: text("source_key", 180, true),
      brand: text("brand", 120, true),
      title: text("title", 240, true),
      description: text("description", 1000),
      image_url: text("image_url", 1000),
      offer_url: text("offer_url", 1000),
      category: text("category", 120) ?? "عام",
      city: text("city", 120),
      original_price: numeric("original_price"),
      price: numeric("price"),
      discount_percent: Math.max(0, Math.min(100, Number(d.discount_percent) || 0)),
      rank: Math.max(0, Math.min(9999, Number(d.rank) || 0)),
      active: d.active !== false,
    };
  })
  .handler(async ({ context, data }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id: _id, ...rest } = data;
    const payload = rest as never;
    const query = data.id
      ? supabaseAdmin.from("showroom_offers").update(payload).eq("id", data.id).select().single()
      : supabaseAdmin.from("showroom_offers").insert(payload).select().single();
    const { data: row, error } = await query;
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteShowroomOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => ({
    id: String((value as { id?: unknown })?.id ?? "").trim(),
  }))
  .handler(async ({ context, data }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("showroom_offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
