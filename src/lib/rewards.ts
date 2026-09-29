// Client-side points ledger stored in localStorage.
// Actions: copy coupon (+10), share (+5), visit deal (+2), build smart list (+15).
// المستخدم المسجّل: نفس النقاط تُسجَّل أيضاً في حسابه داخل قاعدة البيانات.

import { supabase } from "@/integrations/supabase/client";

const KEY = "waffer_rewards_v1";
const SYNC_FLAG = "waffer_rewards_guest_synced";

export type RewardAction = "copy_coupon" | "share" | "visit_deal" | "smart_list";

export const ACTION_POINTS: Record<RewardAction, number> = {
  copy_coupon: 10,
  share: 5,
  visit_deal: 2,
  smart_list: 15,
};

export const ACTION_LABEL: Record<RewardAction, string> = {
  copy_coupon: "نسخ كوبون",
  share: "مشاركة عرض",
  visit_deal: "زيارة عرض",
  smart_list: "بناء قائمة ذكية",
};

export type HistoryEntry = {
  action: RewardAction | "redeem";
  points: number;
  at: number;
  label?: string;
  rewardId?: string;
};

export type RewardState = {
  name: string;
  points: number;
  history: HistoryEntry[];
};

const DEFAULT: RewardState = { name: "زائر", points: 0, history: [] };

export function loadRewards(): RewardState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function saveRewards(state: RewardState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("waffer:rewards"));
}

async function pushToAccount(action: RewardAction) {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.rpc("award_points", { _action: action });
  } catch {
    /* النقاط المحلية محفوظة على أي حال */
  }
}

export function addPoints(action: RewardAction): RewardState {
  const s = loadRewards();
  const pts = ACTION_POINTS[action];
  const next: RewardState = {
    ...s,
    points: s.points + pts,
    history: [{ action, points: pts, at: Date.now() }, ...s.history].slice(0, 50),
  };
  saveRewards(next);
  // مزامنة النقطة نفسها مع حساب المستخدم إن كان مسجلاً (بدون تعطيل الواجهة)
  void pushToAccount(action);
  return next;
}

/** نقاط محفوظة كزائر → تُضاف لحسابك مرة واحدة عند أول تسجيل دخول */
export async function syncGuestBalanceOnce(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(SYNC_FLAG)) return false;
    const total = loadRewards().points;
    if (total <= 0) {
      window.localStorage.setItem(SYNC_FLAG, "1");
      return false;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    const { error } = await supabase.rpc("sync_guest_points", { _total: total });
    if (error) return false;
    window.localStorage.setItem(SYNC_FLAG, "1");
    window.dispatchEvent(new CustomEvent("waffer:rewards"));
    return true;
  } catch {
    return false;
  }
}

export type RedeemResult = { ok: true; state: RewardState } | { ok: false; missing: number };

export function redeemReward(rewardId: string, cost: number, label: string): RedeemResult {
  const s = loadRewards();
  if (s.points < cost) return { ok: false, missing: cost - s.points };
  const next: RewardState = {
    ...s,
    points: s.points - cost,
    history: [
      { action: "redeem" as const, points: -cost, at: Date.now(), label, rewardId },
      ...s.history,
    ].slice(0, 50),
  };
  saveRewards(next);
  return { ok: true, state: next };
}

export function setName(name: string) {
  const s = loadRewards();
  saveRewards({ ...s, name: name.trim() || "زائر" });
}

export function clearHistory() {
  const s = loadRewards();
  saveRewards({ ...s, history: [] });
}

export type RewardItem = {
  id: string;
  cost: number;
  title: string;
  desc: string;
  icon: string;
  details: string;
  terms: string[];
};

// لا بيانات تخمينية: الكتالوج يبقى فاضيًا حتى اعتماد جوائز حقيقية بشراكات موثقة.
// نقاط المستخدم تُحفظ وتُجمَّع، والاستبدال يُفتح بعد اعتماد الجوائز.
export const REWARDS_CATALOG: RewardItem[] = [];
