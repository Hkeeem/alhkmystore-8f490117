/** تفضيلات المستخدم المحلية: تتعلّم من تصفّح العروض */

const KEY = "hkeeem-prefs-v1";

export type Prefs = {
  categories: Record<string, number>;
  stores: Record<string, number>;
};

const EMPTY: Prefs = { categories: {}, stores: {} };

export function readPrefs(): Prefs {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      categories: parsed.categories ?? {},
      stores: parsed.stores ?? {},
    };
  } catch {
    return EMPTY;
  }
}

/** يسجّل اهتمام المستخدم بفئة/متجر (عند فتح عرض أو التفاعل معه) */
export function recordInterest(category: string, storeId: string, weight = 1) {
  if (typeof window === "undefined") return;
  const prefs = readPrefs();
  prefs.categories[category] = (prefs.categories[category] ?? 0) + weight;
  prefs.stores[storeId] = (prefs.stores[storeId] ?? 0) + weight;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("hkeeem-prefs-change"));
  } catch {
    /* تجاهل امتلاء التخزين */
  }
}

export function clearPrefs() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("hkeeem-prefs-change"));
}

export function hasPrefs(prefs: Prefs): boolean {
  return Object.keys(prefs.categories).length > 0 || Object.keys(prefs.stores).length > 0;
}
