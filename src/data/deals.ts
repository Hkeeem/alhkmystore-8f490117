export type Category =
  | "سوبرماركت"
  | "مطاعم"
  | "إلكترونيات"
  | "أزياء"
  | "صيدلية";

export type Store = {
  id: string;
  name: string;
  logo: string;
  logoUrl?: string; // URL for real store logo image
  color: string;
  category: Category;
};

export const stores: Store[] = [
  // سوبرماركت
  {
    id: "othaim", name: "أسواق العثيم", logo: "ع",
    logoUrl: "https://upload.wikimedia.org/wikipedia/ar/thumb/7/7b/Othaim_Markets_Logo.svg/200px-Othaim_Markets_Logo.svg.png",
    color: "oklch(0.55 0.18 25)", category: "سوبرماركت"
  },
  {
    id: "panda", name: "بنده", logo: "ب",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Panda_Retail_Company_Logo.svg/200px-Panda_Retail_Company_Logo.svg.png",
    color: "oklch(0.5 0.2 145)", category: "سوبرماركت"
  },
  {
    id: "lulu", name: "لولو هايبر", logo: "ل",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/LuLu_Hypermarket_Logo.svg/200px-LuLu_Hypermarket_Logo.svg.png",
    color: "oklch(0.55 0.2 260)", category: "سوبرماركت"
  },
  {
    id: "danube", name: "الدانوب", logo: "د",
    logoUrl: "https://logo.clearbit.com/danube.com.sa",
    color: "oklch(0.5 0.19 220)", category: "سوبرماركت"
  },
  {
    id: "tamimi", name: "أسواق التميمي", logo: "ت",
    logoUrl: "https://logo.clearbit.com/tamimimarkets.com",
    color: "oklch(0.5 0.15 30)", category: "سوبرماركت"
  },
  // مطاعم
  {
    id: "hunger", name: "هنقرستيشن", logo: "H",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/HungerStation_Logo.svg/200px-HungerStation_Logo.svg.png",
    color: "oklch(0.65 0.22 40)", category: "مطاعم"
  },
  {
    id: "jahez", name: "جاهز", logo: "ج",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Jahez_logo.svg/200px-Jahez_logo.svg.png",
    color: "oklch(0.6 0.2 340)", category: "مطاعم"
  },
  {
    id: "toshel", name: "توصيل", logo: "T",
    logoUrl: "https://logo.clearbit.com/tawseel.com.sa",
    color: "oklch(0.55 0.18 200)", category: "مطاعم"
  },
  // إلكترونيات
  {
    id: "noon", name: "نون", logo: "N",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Noon_logo.svg/200px-Noon_logo.svg.png",
    color: "oklch(0.55 0.22 320)", category: "إلكترونيات"
  },
  {
    id: "amazon", name: "أمازون السعودية", logo: "A",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/200px-Amazon_logo.svg.png",
    color: "oklch(0.5 0.18 60)", category: "إلكترونيات"
  },
  {
    id: "jarir", name: "جرير", logo: "ج",
    logoUrl: "https://upload.wikimedia.org/wikipedia/ar/thumb/4/4a/Jarir_Bookstore_Logo.svg/200px-Jarir_Bookstore_Logo.svg.png",
    color: "oklch(0.45 0.2 25)", category: "إلكترونيات"
  },
  {
    id: "extra", name: "إكسترا", logo: "X",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Extra_logo.svg/200px-Extra_logo.svg.png",
    color: "oklch(0.5 0.2 30)", category: "إلكترونيات"
  },
  // صيدلية
  {
    id: "nahdi", name: "صيدلية النهدي", logo: "N",
    logoUrl: "https://upload.wikimedia.org/wikipedia/ar/thumb/2/24/Al_Nahdi_Medical_Company_Logo.svg/200px-Al_Nahdi_Medical_Company_Logo.svg.png",
    color: "oklch(0.5 0.2 155)", category: "صيدلية"
  },
  {
    id: "dawaa", name: "صيدلية الدواء", logo: "د",
    logoUrl: "https://logo.clearbit.com/aldawaa.com",
    color: "oklch(0.55 0.18 180)", category: "صيدلية"
  },
];

export type Deal = {
  id: string;
  title: string;
  brand?: string;
  storeId: string;
  category: Category;
  originalPrice: number;
  price: number;
  unit?: string;
  image: string; // emoji
  tags?: string[];
  expiresIn: string;
  productKey?: string; // for cross-store comparison
  productUrl?: string; // رابط المنتج في متجر المصدر
};

/**
 * قائمة العروض الحقيقية.
 * لا توجد بيانات تجريبية — تُملأ في وقت التشغيل من قاعدة البيانات
 * (عروض التجّار المنشورة + العروض المسحوبة/المستوردة) عبر `setDeals`.
 */
export const deals: Deal[] = [];

/** متاجر إضافية تُسجَّل ديناميكياً من قاعدة البيانات (تجّار/مصادر خارجية) */
const dynamicStores: Store[] = [];

export function registerStore(store: Store) {
  if (stores.some((s) => s.id === store.id) || dynamicStores.some((s) => s.id === store.id)) return;
  dynamicStores.push(store);
}

export function setDeals(next: Deal[]) {
  deals.splice(0, deals.length, ...next);
}

export function discountPercent(d: Deal) {
  if (!d.originalPrice || d.originalPrice <= d.price) return 0;
  return Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100);
}

export function allStores(): Store[] {
  return [...stores, ...dynamicStores];
}

export function getStore(id: string): Store {
  const found = stores.find((s) => s.id === id) ?? dynamicStores.find((s) => s.id === id);
  if (found) return found;
  return {
    id,
    name: id,
    logo: id.slice(0, 1).toUpperCase(),
    color: "oklch(0.72 0.13 85)",
    category: "سوبرماركت",
  };
}

export function bestDeals(n = 6) {
  return [...deals].sort((a, b) => discountPercent(b) - discountPercent(a)).slice(0, n);
}

export function comparableGroups() {
  const map = new Map<string, Deal[]>();
  for (const d of deals) {
    if (!d.productKey) continue;
    if (!map.has(d.productKey)) map.set(d.productKey, []);
    map.get(d.productKey)!.push(d);
  }
  return [...map.values()].filter((g) => g.length > 1).map((g) => g.sort((a, b) => a.price - b.price));
}

