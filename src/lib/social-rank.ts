/**
 * ترتيب ذكي لعروض السوشال ميديا:
 * القوة (حضور المتجر الرسمي) + التفاعل (نشاط المنصة للمتجر) + تفضيل المستخدم (نقراته واهتماماته).
 */

export type SocialSignal = {
  /** قوة العلامة التجارية وحضورها الرسمي 0..100 */
  strength: number;
  /** معدل التفاعل التقديري على منصات التواصل 0..100 */
  engagement: number;
  /** المنصات التي يكون فيها المتجر أنشط */
  bestPlatforms: string[];
};

/** إشارات القوة/التفاعل للمتاجر الأنشط رسمياً في السعودية */
export const SOCIAL_SIGNALS: Record<string, SocialSignal> = {
  noon: { strength: 98, engagement: 95, bestPlatforms: ["snapchat", "instagram", "tiktok"] },
  "amazon-sa": { strength: 97, engagement: 88, bestPlatforms: ["x", "youtube", "instagram"] },
  extra: { strength: 90, engagement: 86, bestPlatforms: ["snapchat", "x", "tiktok"] },
  jarir: { strength: 92, engagement: 84, bestPlatforms: ["x", "instagram", "youtube"] },
  shein: { strength: 94, engagement: 96, bestPlatforms: ["tiktok", "instagram", "snapchat"] },
  namshi: { strength: 88, engagement: 90, bestPlatforms: ["instagram", "tiktok", "snapchat"] },
  "nice-one": { strength: 86, engagement: 92, bestPlatforms: ["snapchat", "instagram", "tiktok"] },
  nahdi: { strength: 89, engagement: 80, bestPlatforms: ["snapchat", "x", "instagram"] },
  panda: { strength: 91, engagement: 82, bestPlatforms: ["snapchat", "x", "telegram"] },
  othaim: { strength: 87, engagement: 79, bestPlatforms: ["snapchat", "x", "telegram"] },
  "carrefour-sa": { strength: 85, engagement: 78, bestPlatforms: ["snapchat", "instagram", "telegram"] },
  lulu: { strength: 84, engagement: 76, bestPlatforms: ["instagram", "snapchat", "telegram"] },
  jahez: { strength: 88, engagement: 91, bestPlatforms: ["tiktok", "snapchat", "x"] },
  hungerstation: { strength: 87, engagement: 89, bestPlatforms: ["snapchat", "tiktok", "x"] },
  styli: { strength: 80, engagement: 85, bestPlatforms: ["tiktok", "instagram", "snapchat"] },
  trendyol: { strength: 83, engagement: 88, bestPlatforms: ["tiktok", "instagram"] },
  "sephora-sa": { strength: 85, engagement: 87, bestPlatforms: ["instagram", "tiktok", "snapchat"] },
  "golden-scent": { strength: 78, engagement: 84, bestPlatforms: ["snapchat", "instagram"] },
  "ikea-sa": { strength: 86, engagement: 77, bestPlatforms: ["instagram", "youtube", "x"] },
  "home-centre": { strength: 79, engagement: 74, bestPlatforms: ["instagram", "snapchat"] },
  floward: { strength: 77, engagement: 82, bestPlatforms: ["instagram", "snapchat", "tiktok"] },
  almosafer: { strength: 82, engagement: 75, bestPlatforms: ["x", "instagram", "youtube"] },
};

const DEFAULT_SIGNAL: SocialSignal = { strength: 60, engagement: 58, bestPlatforms: [] };

export function getSocialSignal(storeId: string): SocialSignal {
  return SOCIAL_SIGNALS[storeId] ?? DEFAULT_SIGNAL;
}

/* ------------------------ تفضيلات المستخدم (محلية) ------------------------ */

const PREF_KEY = "hkeeem.social.prefs.v1";

export type SocialPrefs = {
  /** عدد نقرات المستخدم على كل متجر */
  storeClicks: Record<string, number>;
  /** عدد استخدام كل منصة */
  platformClicks: Record<string, number>;
  /** فئات مفضّلة صراحةً */
  favoriteCategories: string[];
};

const EMPTY_PREFS: SocialPrefs = { storeClicks: {}, platformClicks: {}, favoriteCategories: [] };

export function loadSocialPrefs(): SocialPrefs {
  if (typeof window === "undefined") return EMPTY_PREFS;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return EMPTY_PREFS;
    const parsed = JSON.parse(raw) as Partial<SocialPrefs>;
    return {
      storeClicks: parsed.storeClicks ?? {},
      platformClicks: parsed.platformClicks ?? {},
      favoriteCategories: parsed.favoriteCategories ?? [],
    };
  } catch {
    return EMPTY_PREFS;
  }
}

export function saveSocialPrefs(prefs: SocialPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* تجاهل امتلاء التخزين */
  }
}

export function recordSocialClick(
  prefs: SocialPrefs,
  storeId: string,
  platformId: string,
): SocialPrefs {
  const next: SocialPrefs = {
    ...prefs,
    storeClicks: { ...prefs.storeClicks, [storeId]: (prefs.storeClicks[storeId] ?? 0) + 1 },
    platformClicks: { ...prefs.platformClicks, [platformId]: (prefs.platformClicks[platformId] ?? 0) + 1 },
  };
  saveSocialPrefs(next);
  return next;
}

export function toggleFavoriteCategory(prefs: SocialPrefs, category: string): SocialPrefs {
  const has = prefs.favoriteCategories.includes(category);
  const next: SocialPrefs = {
    ...prefs,
    favoriteCategories: has
      ? prefs.favoriteCategories.filter((c) => c !== category)
      : [...prefs.favoriteCategories, category],
  };
  saveSocialPrefs(next);
  return next;
}

/* ------------------------------ محرك الترتيب ------------------------------ */

export type RankedStore<T> = {
  store: T;
  score: number;
  reasons: string[];
};

export type RankInput = {
  id: string;
  category: string;
};

/**
 * النتيجة = 0.40 قوة + 0.30 تفاعل (مع مضاعف ملاءمة المنصة) + 0.30 تفضيل المستخدم.
 */
export function rankSocialStores<T extends RankInput>(
  stores: T[],
  platformId: string,
  prefs: SocialPrefs,
): RankedStore<T>[] {
  const maxClicks = Math.max(1, ...Object.values(prefs.storeClicks));

  return stores
    .map((store) => {
      const signal = getSocialSignal(store.id);
      const reasons: string[] = [];

      const strengthScore = signal.strength;
      if (signal.strength >= 88) reasons.push("علامة قوية وموثوقة");

      const platformIndex = signal.bestPlatforms.indexOf(platformId);
      const platformBoost = platformIndex === -1 ? 0.75 : 1.15 - platformIndex * 0.05;
      const engagementScore = Math.min(100, signal.engagement * platformBoost);
      if (platformIndex === 0) reasons.push("الأنشط على هذه المنصة");
      else if (platformIndex > 0) reasons.push("نشِط على هذه المنصة");

      const clicks = prefs.storeClicks[store.id] ?? 0;
      let prefScore = (clicks / maxClicks) * 70;
      if (clicks > 0) reasons.push("تزوره كثيراً");
      if (prefs.favoriteCategories.includes(store.category)) {
        prefScore += 30;
        reasons.push("من فئاتك المفضّلة");
      }
      prefScore = Math.min(100, prefScore);

      const score = 0.4 * strengthScore + 0.3 * engagementScore + 0.3 * prefScore;
      return { store, score: Math.round(score * 10) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
