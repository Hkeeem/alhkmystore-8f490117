import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CITIES, branches } from "@/data/store-branches";
import { stores } from "@/data/deals";

export type StoreGroupId = "all" | "hyper" | "retail" | "pharmacy" | "online" | "food";

export type GeoScope = "neighborhood" | "city" | "all";

export const STORE_GROUPS: Array<{
  id: StoreGroupId;
  label: string;
  emoji: string;
  storeIds: string[];
}> = [
  { id: "all", label: "كافة المتاجر", emoji: "🌟", storeIds: [] },
  { id: "hyper", label: "هايبر ماركت", emoji: "🏬", storeIds: ["panda", "lulu", "carrefour"] },
  { id: "retail", label: "متاجر التجزئة", emoji: "🛒", storeIds: ["othaim", "danube", "tamimi"] },
  { id: "pharmacy", label: "صيدليات", emoji: "💊", storeIds: ["nahdi", "dawaa"] },
  { id: "online", label: "متاجر إلكترونية", emoji: "📦", storeIds: ["noon", "amazon", "jarir", "extra"] },
  { id: "food", label: "مطاعم وتوصيل", emoji: "🍔", storeIds: ["hunger", "jahez", "toshel"] },
];

export const CITY_NAMES = CITIES.map((c) => c.name);

export function branchCount(storeId: string, city: string): number {
  return branches.filter((b) => b.storeId === storeId && b.city === city).length;
}

export function storesInGroup(groupId: StoreGroupId): string[] {
  const group = STORE_GROUPS.find((g) => g.id === groupId);
  if (!group || group.storeIds.length === 0) {
    return stores.map((s) => s.id);
  }
  return group.storeIds;
}

const CITY_KEY = "hkeeem-scope-city";
const SCOPE_KEY = "hkeeem-geo-scope";

interface StoreScopeContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  geoScope: GeoScope;
  setGeoScope: (scope: GeoScope) => void;
  activeGroup: StoreGroupId;
  setActiveGroup: (group: StoreGroupId) => void;
  city: string;
  scopedStores: typeof stores;
}

const StoreScopeContext = createContext<StoreScopeContextType | undefined>(undefined);

export function StoreScopeProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CITY_KEY) || "جدة";
    }
    return "جدة";
  });

  const [geoScope, setGeoScope] = useState<GeoScope>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(SCOPE_KEY) as GeoScope) || "city";
    }
    return "city";
  });

  const [activeGroup, setActiveGroup] = useState<StoreGroupId>("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CITY_KEY, selectedCity);
      localStorage.setItem(SCOPE_KEY, geoScope);
    }
  }, [selectedCity, geoScope]);

  return (
    <StoreScopeContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        geoScope,
        setGeoScope,
        activeGroup,
        setActiveGroup,
        city: selectedCity,
        scopedStores: (() => {
          const ids = storesInGroup(activeGroup);
          return stores.filter((s) => ids.includes(s.id));
        })(),
      }}
    >
      {children}
    </StoreScopeContext.Provider>
  );
}

export function useStoreScope() {
  const context = useContext(StoreScopeContext);
  if (!context) {
    throw new Error("useStoreScope must be used within a StoreScopeProvider");
  }
  return context;
}
