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

export type RedeemResult =
  | { ok: true; state: RewardState }
  | { ok: false; missing: number };

export function redeemReward(rewardId: string, cost: number, label: string): RedeemResult {
  const s = loadRewards();
  if (s.points < cost) return { ok: false, missing: cost - s.points };
  const next: RewardState = {
    ...s,
    points: s.points - cost,
    history: [
      { action: "redeem", points: -cost, at: Date.now(), label, rewardId },
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

export const REWARDS_CATALOG: RewardItem[] = [
  {
    id: "r1",
    cost: 100,
    title: "كود شحن مجاني",
    desc: "على أول طلب من هنقرستيشن",
    icon: "🚚",
    details: "كود خصم يوفّر رسوم التوصيل بالكامل على أول طلب لك من تطبيق هنقرستيشن.",
    terms: [
      "صالح لأول طلب فقط لكل مستخدم",
      "الحد الأدنى للطلب 30 ر.س",
      "ينتهي بعد 14 يوم من الاستبدال",
    ],
  },
  {
    id: "r2",
    cost: 250,
    title: "خصم 25 ر.س نون",
    desc: "قسيمة إلكترونيات من نون",
    icon: "🛒",
    details: "قسيمة خصم 25 ريال على مشترياتك من قسم الإلكترونيات في نون.",
    terms: [
      "الحد الأدنى للطلب 150 ر.س",
      "غير قابل للاستخدام مع عروض أخرى",
      "صالح لمدة 30 يوم",
    ],
  },
  {
    id: "r3",
    cost: 500,
    title: "بطاقة جرير 50 ر.س",
    desc: "قسيمة شراء إلكترونية",
    icon: "🎁",
    details: "بطاقة هدايا إلكترونية بقيمة 50 ريال قابلة للاستخدام في فروع جرير وموقعهم.",
    terms: [
      "يتم إرسال الكود عبر البريد",
      "صالحة لمدة 6 أشهر",
      "غير قابلة للاسترداد نقداً",
    ],
  },
  {
    id: "r4",
    cost: 1000,
    title: "بطاقة هدايا 100 ر.س",
    desc: "لأي متجر من متاجر وفّر",
    icon: "💎",
    details: "بطاقة هدايا مرنة بقيمة 100 ريال تختار المتجر اللي تبيها فيه.",
    terms: [
      "تختار المتجر بعد الاستبدال",
      "صالحة لمدة سنة كاملة",
      "قابلة للإهداء",
    ],
  },
];


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
