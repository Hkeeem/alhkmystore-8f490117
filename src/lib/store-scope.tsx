import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { stores, type Store } from "@/data/deals";
import { CITIES, branches } from "@/data/store-branches";

export type StoreGroupId = "all" | "hyper" | "retail" | "pharmacy" | "online" | "food";

export type StoreGroup = {
  id: StoreGroupId;
  label: string;
  emoji: string;
  /** معرّفات المتاجر ضمن الفئة (فارغة = الكل) */
  storeIds: string[];
};

export const STORE_GROUPS: StoreGroup[] = [
  { id: "all", label: "كافة المتاجر", emoji: "🌟", storeIds: [] },
  { id: "hyper", label: "هايبر ماركت", emoji: "🏬", storeIds: ["panda", "lulu", "carrefour"] },
  {
    id: "retail",
    label: "متاجر التجزئة",
    emoji: "🛒",
    storeIds: ["othaim", "danube", "tamimi"],
  },
  { id: "pharmacy", label: "صيدليات", emoji: "💊", storeIds: ["nahdi", "dawaa"] },
  {
    id: "online",
    label: "متاجر إلكترونية",
    emoji: "📦",
    storeIds: ["noon", "amazon", "jarir", "extra"],
  },
  { id: "food", label: "مطاعم وتوصيل", emoji: "🍔", storeIds: ["hunger", "jahez", "toshel"] },
];

export const CITY_NAMES = CITIES.map((c) => c.name);

const CITY_KEY = "hkeeem-scope-city";
const GROUP_KEY = "hkeeem-scope-group";
const DEFAULT_CITY = "الرياض";

export function storesInGroup(groupId: StoreGroupId): Store[] {
  const group = STORE_GROUPS.find((g) => g.id === groupId);
  if (!group || group.storeIds.length === 0) return stores;
  return stores.filter((s) => group.storeIds.includes(s.id));
}

/** عدد فروع متاجر الفئة داخل المدينة المحددة */
export function branchCount(city: string, groupId: StoreGroupId): number {
  const ids = new Set(storesInGroup(groupId).map((s) => s.id));
  return branches.filter((b) => b.city === city && ids.has(b.storeId)).length;
}

type ScopeValue = {
  city: string;
  group: StoreGroupId;
  setCity: (c: string) => void;
  setGroup: (g: StoreGroupId) => void;
  /** المتاجر المشمولة بالفلترة الحالية */
  scopedStores: Store[];
  /** هل معرّف المتجر ضمن النطاق الحالي */
  inScope: (storeId: string | null | undefined) => boolean;
  isFiltered: boolean;
  reset: () => void;
};

const ScopeContext = createContext<ScopeValue | null>(null);

export function StoreScopeProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState(DEFAULT_CITY);
  const [group, setGroupState] = useState<StoreGroupId>("all");

  useEffect(() => {
    try {
      const c = localStorage.getItem(CITY_KEY);
      if (c && CITY_NAMES.includes(c)) setCityState(c);
      const g = localStorage.getItem(GROUP_KEY) as StoreGroupId | null;
      if (g && STORE_GROUPS.some((x) => x.id === g)) setGroupState(g);
    } catch {
      /* تجاهل */
    }
  }, []);

  const setCity = (c: string) => {
    setCityState(c);
    try {
      localStorage.setItem(CITY_KEY, c);
    } catch {
      /* تجاهل */
    }
  };

  const setGroup = (g: StoreGroupId) => {
    setGroupState(g);
    try {
      localStorage.setItem(GROUP_KEY, g);
    } catch {
      /* تجاهل */
    }
  };

  const value = useMemo<ScopeValue>(() => {
    const scopedStores = storesInGroup(group);
    const ids = new Set(scopedStores.map((s) => s.id));
    return {
      city,
      group,
      setCity,
      setGroup,
      scopedStores,
      inScope: (storeId) => group === "all" || (!!storeId && ids.has(storeId)),
      isFiltered: group !== "all",
      reset: () => setGroup("all"),
    };
  }, [city, group]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useStoreScope(): ScopeValue {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useStoreScope must be used inside StoreScopeProvider");
  return ctx;
}
