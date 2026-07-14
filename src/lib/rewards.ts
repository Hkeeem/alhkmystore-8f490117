// Client-side points ledger stored in localStorage.
// Actions: copy coupon (+10), share (+5), visit deal (+2), build smart list (+15).

const KEY = "waffer_rewards_v1";

export type RewardAction =
  | "copy_coupon"
  | "share"
  | "visit_deal"
  | "smart_list";

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

export type RewardState = {
  name: string;
  points: number;
  history: { action: RewardAction; points: number; at: number }[];
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

export function addPoints(action: RewardAction): RewardState {
  const s = loadRewards();
  const pts = ACTION_POINTS[action];
  const next: RewardState = {
    ...s,
    points: s.points + pts,
    history: [{ action, points: pts, at: Date.now() }, ...s.history].slice(0, 50),
  };
  saveRewards(next);
  return next;
}

export function setName(name: string) {
  const s = loadRewards();
  saveRewards({ ...s, name: name.trim() || "زائر" });
}

export function clearHistory() {
  const s = loadRewards();
  saveRewards({ ...s, history: [] });
}

// Fake leaderboard "seed" so a fresh user sees a populated board.
export const SEED_LEADERBOARD: { name: string; points: number }[] = [
  { name: "أبو فيصل", points: 1420 },
  { name: "منيرة", points: 1180 },
  { name: "خالد الشمري", points: 960 },
  { name: "نوره", points: 815 },
  { name: "سلطان", points: 720 },
  { name: "ريم القحطاني", points: 640 },
  { name: "عبدالعزيز", points: 510 },
  { name: "هند", points: 430 },
  { name: "ماجد", points: 355 },
  { name: "لمى", points: 240 },
];
