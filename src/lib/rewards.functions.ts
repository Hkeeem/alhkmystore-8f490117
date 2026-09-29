// دوال الخادم لجواهر ونقاط حكيم — مربوطة بالحساب الحقيقي في قاعدة البيانات
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type LeaderRow = { display_name: string; points: number; rank: number };

export type RewardEvent = {
  action: string;
  points: number;
  label: string | null;
  created_at: string;
};

export type RewardProfile = {
  points: number;
  displayName: string | null;
  myRank: number | null;
  events: RewardEvent[];
  leaderboard: LeaderRow[];
};

const REWARD_ACTIONS = ["copy_coupon", "share", "visit_deal", "smart_list"] as const;

export const getRewardProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RewardProfile> => {
    const acct = await context.supabase
      .from("reward_accounts")
      .select("points, display_name")
      .eq("user_id", context.userId)
      .maybeSingle();

    const myPoints = acct.data?.points ?? 0;
    const iHaveName = !!acct.data?.display_name;

    const [events, board, ahead] = await Promise.all([
      context.supabase
        .from("reward_events")
        .select("action, points, label, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase.rpc("get_reward_leaderboard"),
      context.supabase
        .from("reward_accounts")
        .select("points", { count: "exact", head: true })
        .gt("points", myPoints),
    ]);

    const aheadCount = typeof ahead.count === "number" ? ahead.count : 0;

    return {
      points: myPoints,
      displayName: acct.data?.display_name ?? null,
      myRank: iHaveName && myPoints > 0 ? aheadCount + 1 : null,
      events: (events.data ?? []) as RewardEvent[],
      leaderboard: (board.data ?? []) as LeaderRow[],
    };
  });

export const awardPointsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      action: z.enum(REWARD_ACTIONS),
      label: z.string().max(120).nullish(),
    }).parse,
  )
  .handler(async ({ context, data }) => {
    const { data: total, error } = await context.supabase.rpc("award_points", {
      _action: data.action,
      _label: data.label ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { total: Number(total) };
  });

export const syncGuestPointsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ total: z.number().int().min(1).max(100000) }).parse)
  .handler(async ({ context, data }) => {
    const { data: total, error } = await context.supabase.rpc("sync_guest_points", {
      _total: data.total,
    });
    if (error) throw new Error(error.message);
    return { total: Number(total) };
  });

export const redeemRewardServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      rewardId: z.string().min(1).max(60),
      title: z.string().min(1).max(120),
      cost: z.number().int().min(1).max(100000),
    }).parse,
  )
  .handler(async ({ context, data }) => {
    const { data: remaining, error } = await context.supabase.rpc("redeem_reward", {
      _reward_id: data.rewardId,
      _reward_title: data.title,
      _cost: data.cost,
    });
    if (error) throw new Error(error.message);
    const left = Number(remaining);
    if (left < 0) return { ok: false, remaining: 0, missing: Math.max(0, data.cost) };
    return { ok: true, remaining: left, missing: 0 };
  });

export const saveDisplayNameServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().min(1).max(40) }).parse)
  .handler(async ({ context, data }) => {
    const name = data.name.trim();
    if (!name) throw new Error("name_required");
    const { error } = await context.supabase
      .from("reward_accounts")
      .upsert(
        { user_id: context.userId, display_name: name },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, name };
  });
