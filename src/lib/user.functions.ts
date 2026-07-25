import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Role = "super_admin" | "admin" | "support" | "content_manager" | "user";

async function hasAnyRole(supabase: any, userId: string, roles: Role[]) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const mine = ((data as { role: Role }[] | null) ?? []).map((r) => r.role);
  return mine.some((r) => roles.includes(r));
}

/* ============================================================
 * FAVORITES
 * ============================================================ */

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      itemType: z.enum(["deal", "coupon", "reward", "store"]),
      itemId: z.string().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("favorites")
      .select("id")
      .eq("user_id", context.userId)
      .eq("item_type", data.itemType)
      .eq("item_id", data.itemId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("favorites").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { favorited: false };
    }
    const { error } = await context.supabase.from("favorites").insert({
      user_id: context.userId,
      item_type: data.itemType,
      item_id: data.itemId,
    });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });

/* ============================================================
 * PRICE ALERTS
 * ============================================================ */

export const listMyAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPriceAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      dealId: z.string().min(1).max(200),
      productKey: z.string().max(200).nullable(),
      title: z.string().min(1).max(200),
      currentPrice: z.number().nonnegative(),
      targetPrice: z.number().nonnegative(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("price_alerts").upsert(
      {
        user_id: context.userId,
        deal_id: data.dealId,
        product_key: data.productKey,
        title: data.title,
        current_price: data.currentPrice,
        target_price: data.targetPrice,
        active: true,
        triggered_at: null,
      },
      { onConflict: "user_id,deal_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("price_alerts")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("price_alerts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * CASHBACK
 * ============================================================ */

export const listMyCashback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [txs, totals] = await Promise.all([
      context.supabase
        .from("cashback_transactions")
        .select("*")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("cashback_user_totals")
        .select("*")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (txs.error) throw new Error(txs.error.message);
    return {
      transactions: txs.data ?? [],
      totals: (totals.data as { confirmed_total: number; pending_total: number; paid_total: number; tx_count: number } | null) ?? {
        confirmed_total: 0, pending_total: 0, paid_total: 0, tx_count: 0,
      },
    };
  });

export const logCashbackClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      storeId: z.string().min(1).max(100),
      dealId: z.string().max(200).nullable(),
      purchaseAmount: z.number().positive().max(1_000_000),
      cashbackRate: z.number().min(0).max(100).optional(),
      note: z.string().max(500).nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const rate = data.cashbackRate ?? 2.0;
    const amount = Math.round(data.purchaseAmount * rate) / 100;
    const { error } = await context.supabase.from("cashback_transactions").insert({
      user_id: context.userId,
      store_id: data.storeId,
      deal_id: data.dealId,
      purchase_amount: data.purchaseAmount,
      cashback_rate: rate,
      cashback_amount: amount,
      status: "pending",
      note: data.note,
    });
    if (error) throw new Error(error.message);
    return { ok: true, amount };
  });

/* ============================================================
 * ADMIN — cashback + alerts
 * ============================================================ */

export const adminListCashback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await hasAnyRole(context.supabase, context.userId, ["super_admin", "admin"]))) {
      throw new Error("forbidden");
    }
    const { data, error } = await context.supabase
      .from("cashback_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateCashbackStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "paid", "rejected"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await hasAnyRole(context.supabase, context.userId, ["super_admin", "admin"]))) {
      throw new Error("forbidden");
    }
    const { error } = await context.supabase
      .from("cashback_transactions")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "cashback_status_update",
      target_table: "cashback_transactions",
      target_id: data.id,
      meta: { status: data.status },
    });
    return { ok: true };
  });

export const adminListAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await hasAnyRole(context.supabase, context.userId, ["super_admin", "admin"]))) {
      throw new Error("forbidden");
    }
    const { data, error } = await context.supabase
      .from("price_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
