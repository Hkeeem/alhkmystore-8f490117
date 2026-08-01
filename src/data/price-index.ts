// فهرس الأسعار — مقارنة نفس المنتج بين المتاجر الإلكترونية السعودية
// الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة (15%).

export type RetailerId = "noon" | "amazon" | "jarir" | "extra" | "hkeeem";

export type Retailer = {
  id: RetailerId;
  name: string;
  color: string;
  shipping: string;
};

export const retailers: Retailer[] = [
  { id: "noon", name: "نون", color: "oklch(0.62 0.2 55)", shipping: "شحن 1-3 أيام" },
  { id: "amazon", name: "أمازون السعودية", color: "oklch(0.6 0.15 70)", shipping: "شحن سريع" },
  { id: "jarir", name: "مكتبة جرير", color: "oklch(0.55 0.19 150)", shipping: "استلام من الفرع" },
  { id: "extra", name: "إكسترا", color: "oklch(0.55 0.2 25)", shipping: "تقسيط متاح" },
  { id: "hkeeem", name: "متجر حكيم المباشر", color: "oklch(0.77 0.13 85)", shipping: "سبل/سمسا 24-48 س" },
];

export function getRetailer(id: RetailerId): Retailer {
  return retailers.find((r) => r.id === id) ?? retailers[0];
}

export type PriceCategory = "جوالات" | "حاسبات" | "أجهزة منزلية" | "صوتيات" | "منتجات وطنية";

export type Offer = {
  retailerId: RetailerId;
  price: number; // شامل الضريبة
  inStock: boolean;
  coupon?: { code: string; percent: number };
};

export type PriceProduct = {
  id: string;
  name: string;
  brand: string;
  category: PriceCategory;
  unit?: string;
  offers: Offer[];
};

export const priceProducts: PriceProduct[] = [
  {
    id: "iphone-17-256",
    name: "آيفون 17 — 256 جيجا",
    brand: "Apple",
    category: "جوالات",
    offers: [
      { retailerId: "hkeeem", price: 4149, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "noon", price: 4249, inStock: true, coupon: { code: "NOON10", percent: 10 } },
      { retailerId: "jarir", price: 4299, inStock: true },
      { retailerId: "extra", price: 4349, inStock: true, coupon: { code: "EXTRA50", percent: 3 } },
      { retailerId: "amazon", price: 4399, inStock: false },
    ],
  },
  {
    id: "galaxy-s26-256",
    name: "سامسونج جالاكسي S26 — 256 جيجا",
    brand: "Samsung",
    category: "جوالات",
    offers: [
      { retailerId: "noon", price: 3599, inStock: true, coupon: { code: "SAMS8", percent: 8 } },
      { retailerId: "hkeeem", price: 3649, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "extra", price: 3699, inStock: true },
      { retailerId: "jarir", price: 3749, inStock: true },
      { retailerId: "amazon", price: 3799, inStock: true },
    ],
  },
  {
    id: "macbook-air-m4",
    name: "ماك بوك اير M4 — 13 بوصة",
    brand: "Apple",
    category: "حاسبات",
    offers: [
      { retailerId: "jarir", price: 4899, inStock: true, coupon: { code: "JARIR4", percent: 4 } },
      { retailerId: "amazon", price: 4949, inStock: true },
      { retailerId: "noon", price: 4999, inStock: true, coupon: { code: "NOON10", percent: 10 } },
      { retailerId: "hkeeem", price: 5049, inStock: true },
      { retailerId: "extra", price: 5099, inStock: false },
    ],
  },
  {
    id: "ps5-slim",
    name: "بلايستيشن 5 سليم",
    brand: "Sony",
    category: "حاسبات",
    offers: [
      { retailerId: "extra", price: 2149, inStock: true, coupon: { code: "EXTRA50", percent: 3 } },
      { retailerId: "noon", price: 2199, inStock: true },
      { retailerId: "hkeeem", price: 2229, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "jarir", price: 2249, inStock: true },
      { retailerId: "amazon", price: 2299, inStock: true },
    ],
  },
  {
    id: "airpods-pro-3",
    name: "ايربودز برو 3",
    brand: "Apple",
    category: "صوتيات",
    offers: [
      { retailerId: "noon", price: 899, inStock: true, coupon: { code: "NOON10", percent: 10 } },
      { retailerId: "hkeeem", price: 915, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "amazon", price: 929, inStock: true },
      { retailerId: "jarir", price: 949, inStock: true },
      { retailerId: "extra", price: 969, inStock: true },
    ],
  },
  {
    id: "dyson-v15",
    name: "مكنسة دايسون V15 لاسلكية",
    brand: "Dyson",
    category: "أجهزة منزلية",
    offers: [
      { retailerId: "extra", price: 2399, inStock: true },
      { retailerId: "hkeeem", price: 2429, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "noon", price: 2449, inStock: true, coupon: { code: "HOME7", percent: 7 } },
      { retailerId: "amazon", price: 2499, inStock: true },
      { retailerId: "jarir", price: 2549, inStock: false },
    ],
  },
  {
    id: "tv-55-4k",
    name: "تلفزيون 55 بوصة 4K سمارت",
    brand: "TCL",
    category: "أجهزة منزلية",
    offers: [
      { retailerId: "hkeeem", price: 1599, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "extra", price: 1649, inStock: true, coupon: { code: "EXTRA50", percent: 3 } },
      { retailerId: "noon", price: 1699, inStock: true },
      { retailerId: "amazon", price: 1749, inStock: true },
      { retailerId: "jarir", price: 1799, inStock: true },
    ],
  },
  {
    id: "saudi-dates-1kg",
    name: "تمر سكري القصيم فاخر",
    brand: "منتج وطني",
    category: "منتجات وطنية",
    unit: "1 كجم",
    offers: [
      { retailerId: "hkeeem", price: 69, inStock: true, coupon: { code: "SAUDI10", percent: 10 } },
      { retailerId: "noon", price: 75, inStock: true },
      { retailerId: "amazon", price: 79, inStock: true },
      { retailerId: "extra", price: 85, inStock: false },
      { retailerId: "jarir", price: 89, inStock: false },
    ],
  },
  {
    id: "saudi-coffee-500",
    name: "قهوة عربية سعودية محمّصة",
    brand: "منتج وطني",
    category: "منتجات وطنية",
    unit: "500 جم",
    offers: [
      { retailerId: "hkeeem", price: 45, inStock: true, coupon: { code: "SAUDI10", percent: 10 } },
      { retailerId: "noon", price: 49, inStock: true },
      { retailerId: "amazon", price: 52, inStock: true },
      { retailerId: "extra", price: 55, inStock: true },
      { retailerId: "jarir", price: 59, inStock: false },
    ],
  },
  {
    id: "oud-perfume",
    name: "عطر عود سعودي فاخر",
    brand: "منتج وطني",
    category: "منتجات وطنية",
    unit: "100 مل",
    offers: [
      { retailerId: "noon", price: 249, inStock: true, coupon: { code: "OUD12", percent: 12 } },
      { retailerId: "hkeeem", price: 259, inStock: true, coupon: { code: "HKEEEM5", percent: 5 } },
      { retailerId: "amazon", price: 279, inStock: true },
      { retailerId: "extra", price: 299, inStock: false },
      { retailerId: "jarir", price: 319, inStock: false },
    ],
  },
];

export const priceCategories: PriceCategory[] = [
  "جوالات",
  "حاسبات",
  "أجهزة منزلية",
  "صوتيات",
  "منتجات وطنية",
];

/** السعر النهائي بعد كود الخصم (مقرّب لأقرب ريال) */
export function finalPrice(offer: Offer) {
  if (!offer.coupon) return offer.price;
  return Math.round(offer.price * (1 - offer.coupon.percent / 100));
}

/** ترتيب العروض: الأرخص بعد الكود أولاً، والمتوفر قبل غير المتوفر */
export function sortedOffers(product: PriceProduct) {
  return [...product.offers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return finalPrice(a) - finalPrice(b);
  });
}

export function bestOffer(product: PriceProduct) {
  return sortedOffers(product)[0];
}

export function searchProducts(query: string, category?: PriceCategory | "الكل") {
  const q = query.trim();
  return priceProducts.filter((p) => {
    const matchQ = !q || p.name.includes(q) || p.brand.includes(q) || p.category.includes(q);
    const matchC = !category || category === "الكل" || p.category === category;
    return matchQ && matchC;
  });
}
