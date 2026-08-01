import type { Deal } from "@/data/deals";
import { discountPercent } from "@/data/deals";
import { expiresInDays } from "@/lib/deal-details";
import type { Prefs } from "@/lib/preferences";

/**
 * ترتيب ذكي: يمزج نسبة التوفير + قرب انتهاء العرض + تفضيلات المستخدم.
 * كل مكوّن يُطبّع بين 0 و 1 ثم يُوزن.
 */
const W_DISCOUNT = 0.45;
const W_URGENCY = 0.3;
const W_PREF = 0.25;

/** كلما قرب الانتهاء ارتفعت النتيجة (14 يوم فأكثر = 0) */
export function urgencyScore(deal: Deal): number {
  const days = Math.max(0, expiresInDays(deal.expiresIn));
  if (days >= 14) return 0;
  return (14 - days) / 14;
}

export function preferenceScore(deal: Deal, prefs: Prefs): number {
  const catMax = Math.max(1, ...Object.values(prefs.categories));
  const storeMax = Math.max(1, ...Object.values(prefs.stores));
  const cat = (prefs.categories[deal.category] ?? 0) / catMax;
  const store = (prefs.stores[deal.storeId] ?? 0) / storeMax;
  return Math.min(1, cat * 0.6 + store * 0.4);
}

export function smartScore(deal: Deal, prefs: Prefs): number {
  const discount = Math.min(1, discountPercent(deal) / 70);
  return (
    discount * W_DISCOUNT +
    urgencyScore(deal) * W_URGENCY +
    preferenceScore(deal, prefs) * W_PREF
  );
}

export function smartSort<T extends Deal>(list: T[], prefs: Prefs): T[] {
  return [...list].sort((a, b) => smartScore(b, prefs) - smartScore(a, prefs));
}

/** سبب مختصر يوضّح لماذا رُقّي العرض */
export function smartReason(deal: Deal, prefs: Prefs): string | null {
  const days = expiresInDays(deal.expiresIn);
  if (preferenceScore(deal, prefs) >= 0.5) return "مناسب لاهتماماتك";
  if (days <= 2) return "ينتهي قريباً";
  if (discountPercent(deal) >= 45) return "توفير مرتفع";
  return null;
}
