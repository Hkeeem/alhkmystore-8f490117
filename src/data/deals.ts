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
  color: string;
  category: Category;
};

export const stores: Store[] = [
  { id: "othaim", name: "أسواق العثيم", logo: "ع", color: "oklch(0.55 0.18 25)", category: "سوبرماركت" },
  { id: "panda", name: "بنده", logo: "ب", color: "oklch(0.5 0.2 145)", category: "سوبرماركت" },
  { id: "lulu", name: "لولو هايبر", logo: "ل", color: "oklch(0.55 0.2 260)", category: "سوبرماركت" },
  { id: "danube", name: "الدانوب", logo: "د", color: "oklch(0.5 0.19 220)", category: "سوبرماركت" },
  { id: "tamimi", name: "أسواق التميمي", logo: "ت", color: "oklch(0.5 0.15 30)", category: "سوبرماركت" },
  { id: "hunger", name: "هنقرستيشن", logo: "H", color: "oklch(0.65 0.22 40)", category: "مطاعم" },
  { id: "jahez", name: "جاهز", logo: "ج", color: "oklch(0.6 0.2 340)", category: "مطاعم" },
  { id: "toshel", name: "توصيل", logo: "T", color: "oklch(0.55 0.18 200)", category: "مطاعم" },
  { id: "noon", name: "نون", logo: "N", color: "oklch(0.55 0.22 320)", category: "إلكترونيات" },
  { id: "amazon", name: "أمازون السعودية", logo: "A", color: "oklch(0.5 0.18 60)", category: "إلكترونيات" },
  { id: "jarir", name: "جرير", logo: "ج", color: "oklch(0.45 0.2 25)", category: "إلكترونيات" },
  { id: "extra", name: "إكسترا", logo: "X", color: "oklch(0.5 0.2 30)", category: "إلكترونيات" },
  { id: "nahdi", name: "صيدلية النهدي", logo: "N", color: "oklch(0.5 0.2 155)", category: "صيدلية" },
  { id: "dawaa", name: "صيدلية الدواء", logo: "د", color: "oklch(0.55 0.18 180)", category: "صيدلية" },
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
};

export const deals: Deal[] = [
  // Groceries - with real product images
  { id: "d1", title: "أرز بسمتي أبو كاس", brand: "أبو كاس", storeId: "othaim", category: "سوبرماركت", originalPrice: 89, price: 45, unit: "10 كجم", image: "https://images.unsplash.com/photo-1586080876-f8f93a4e2f5e?w=300&q=80", tags: ["الأكثر مبيعاً"], expiresIn: "3 أيام", productKey: "basmati_10kg" },
  { id: "d2", title: "أرز بسمتي أبو كاس", brand: "أبو كاس", storeId: "panda", category: "سوبرماركت", originalPrice: 89, price: 52, unit: "10 كجم", image: "https://images.unsplash.com/photo-1586080876-f8f93a4e2f5e?w=300&q=80", expiresIn: "5 أيام", productKey: "basmati_10kg" },
  { id: "d3", title: "أرز بسمتي أبو كاس", brand: "أبو كاس", storeId: "lulu", category: "سوبرماركت", originalPrice: 89, price: 49, unit: "10 كجم", image: "https://images.unsplash.com/photo-1586080876-f8f93a4e2f5e?w=300&q=80", expiresIn: "أسبوع", productKey: "basmati_10kg" },
  { id: "d4", title: "زيت عافية دوار الشمس", brand: "عافية", storeId: "danube", category: "سوبرماركت", originalPrice: 35, price: 19, unit: "1.8 لتر", image: "https://images.unsplash.com/photo-1585518419759-8f5e2f0a4e5e?w=300&q=80", tags: ["عرض حار"], expiresIn: "يومان", productKey: "afia_18" },
  { id: "d5", title: "زيت عافية دوار الشمس", brand: "عافية", storeId: "othaim", category: "سوبرماركت", originalPrice: 35, price: 24, unit: "1.8 لتر", image: "https://images.unsplash.com/photo-1585518419759-8f5e2f0a4e5e?w=300&q=80", expiresIn: "4 أيام", productKey: "afia_18" },
  { id: "d6", title: "حليب المراعي طويل الأجل", brand: "المراعي", storeId: "panda", category: "سوبرماركت", originalPrice: 42, price: 27, unit: "12×1 لتر", image: "https://images.unsplash.com/photo-1563056169-519f5e5ed8c0?w=300&q=80", expiresIn: "أسبوع", productKey: "almarai_12" },
  { id: "d7", title: "حليب المراعي طويل الأجل", brand: "المراعي", storeId: "tamimi", category: "سوبرماركت", originalPrice: 42, price: 29, unit: "12×1 لتر", image: "https://images.unsplash.com/photo-1563056169-519f5e5ed8c0?w=300&q=80", expiresIn: "5 أيام", productKey: "almarai_12" },
  { id: "d8", title: "دجاج الوطنية مجمّد", brand: "الوطنية", storeId: "othaim", category: "سوبرماركت", originalPrice: 55, price: 33, unit: "1200 جم", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&q=80", tags: ["توفير عائلي"], expiresIn: "3 أيام", productKey: "watania_chicken" },
  { id: "d9", title: "بيض المزرعة السعيدة", brand: "المزرعة السعيدة", storeId: "danube", category: "سوبرماركت", originalPrice: 22, price: 14, unit: "30 حبة", image: "https://images.unsplash.com/photo-1582722872981-82e07422ff81?w=300&q=80", expiresIn: "يومان", productKey: "eggs_30" },
  { id: "d10", title: "سكر أبيض السنبلة", brand: "السنبلة", storeId: "lulu", category: "سوبرماركت", originalPrice: 32, price: 18, unit: "5 كجم", image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=300&q=80", expiresIn: "أسبوع", productKey: "sugar_5" },
  { id: "d11", title: "قهوة عربية جاهزة", brand: "المطعم", storeId: "tamimi", category: "سوبرماركت", originalPrice: 45, price: 28, unit: "500 جم", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=300&q=80", expiresIn: "أسبوعان", productKey: "arabic_coffee" },

  // Restaurants - with real food images
  { id: "r1", title: "وجبة عائلية دجاج مع الأرز", storeId: "hunger", category: "مطاعم", originalPrice: 120, price: 69, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80", tags: ["توصيل مجاني"], expiresIn: "اليوم" },
  { id: "r2", title: "بيتزا كبيرة + مشروب", storeId: "jahez", category: "مطاعم", originalPrice: 85, price: 42, image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300&q=80", tags: ["خصم 50%"], expiresIn: "3 ساعات" },
  { id: "r3", title: "برجر مضاعف + بطاطس", storeId: "toshel", category: "مطاعم", originalPrice: 55, price: 29, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80", expiresIn: "اليوم" },
  { id: "r4", title: "شاورما عربي + مشروب", storeId: "hunger", category: "مطاعم", originalPrice: 35, price: 19, image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=300&q=80", expiresIn: "الليلة" },

  // Electronics - with real tech product images
  { id: "e1", title: "آيفون 15 برو 256 جيجا", storeId: "noon", category: "إلكترونيات", originalPrice: 4999, price: 3899, image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=300&q=80", tags: ["الأفضل سعراً"], expiresIn: "يومان", productKey: "iphone15pro_256" },
  { id: "e2", title: "آيفون 15 برو 256 جيجا", storeId: "amazon", category: "إلكترونيات", originalPrice: 4999, price: 4099, image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=300&q=80", expiresIn: "أسبوع", productKey: "iphone15pro_256" },
  { id: "e3", title: "آيفون 15 برو 256 جيجا", storeId: "extra", category: "إلكترونيات", originalPrice: 4999, price: 4199, image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=300&q=80", expiresIn: "3 أيام", productKey: "iphone15pro_256" },
  { id: "e4", title: "سماعات AirPods Pro 2", storeId: "jarir", category: "إلكترونيات", originalPrice: 999, price: 699, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", tags: ["خصم 30%"], expiresIn: "5 أيام", productKey: "airpods_pro2" },
  { id: "e5", title: "شاشة سامسونج 55 بوصة", storeId: "extra", category: "إلكترونيات", originalPrice: 2599, price: 1499, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&q=80", tags: ["الجمعة البيضاء"], expiresIn: "يومان", productKey: "samsung_55" },
  { id: "e6", title: "لابتوب HP Pavilion i7", storeId: "jarir", category: "إلكترونيات", originalPrice: 3999, price: 2799, image: "https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=300&q=80", expiresIn: "أسبوع" },

  // Pharmacy - with real pharmacy product images
  { id: "p1", title: "فيتامين سي 1000 مجم", storeId: "nahdi", category: "صيدلية", originalPrice: 89, price: 45, unit: "60 قرص", image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=300&q=80", tags: ["خصم 50%"], expiresIn: "أسبوع", productKey: "vitc_1000" },
  { id: "p2", title: "فيتامين سي 1000 مجم", storeId: "dawaa", category: "صيدلية", originalPrice: 89, price: 52, unit: "60 قرص", image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=300&q=80", expiresIn: "5 أيام", productKey: "vitc_1000" },
  { id: "p3", title: "كريم نيفيا للجسم", storeId: "nahdi", category: "صيدلية", originalPrice: 45, price: 25, unit: "400 مل", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80", expiresIn: "أسبوعان", productKey: "nivea_400" },
  { id: "p4", title: "معجون سنسوداين", storeId: "dawaa", category: "صيدلية", originalPrice: 32, price: 18, unit: "75 مل", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80", expiresIn: "أسبوع" },
];

export function discountPercent(d: Deal) {
  return Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100);
}

export function getStore(id: string) {
  return stores.find((s) => s.id === id)!;
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
