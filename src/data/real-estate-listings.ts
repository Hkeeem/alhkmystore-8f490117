// بيانات العروض العقارية - جدة والمنطقة الغربية
export type PropertyType = "شقة" | "فيلا" | "دوبلكس" | "أرض" | "استوديو" | "مكتب";
export type PurposeType = "بيع" | "إيجار";
export type FinishType = "سوبر لوكس" | "لوكس" | "عادي" | "نظام";

export interface RealEstateListing {
  id: string;
  title: string;
  type: PropertyType;
  purpose: PurposeType;
  price: number; // ريال سعودي
  area: number; // متر مربع
  rooms: number;
  bathrooms: number;
  floors?: number;
  age: number; // عمر العقار بالسنوات
  district: string;
  city: string;
  lat: number;
  lng: number;
  finish: FinishType;
  services: string[]; // الخدمات المتاحة
  features: string[]; // المميزات
  image: string;
  phone: string;
  available: boolean;
}

export const realEstateListings: RealEstateListing[] = [
  {
    id: "re-001",
    title: "فيلا فاخرة في حي الشاطئ",
    type: "فيلا",
    purpose: "بيع",
    price: 2_800_000,
    area: 450,
    rooms: 6,
    bathrooms: 5,
    floors: 2,
    age: 3,
    district: "الشاطئ",
    city: "جدة",
    lat: 21.6167,
    lng: 39.1167,
    finish: "سوبر لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "مول", "كورنيش", "أمن"],
    features: ["مسبح", "مجلس مستقل", "غرفة سائق", "مطبخ راكب", "حديقة", "موقف 3 سيارات"],
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
    phone: "0555000001",
    available: true,
  },
  {
    id: "re-002",
    title: "شقة 4 غرف في حي الروضة",
    type: "شقة",
    purpose: "بيع",
    price: 750_000,
    area: 185,
    rooms: 4,
    bathrooms: 3,
    age: 5,
    district: "الروضة",
    city: "جدة",
    lat: 21.5433,
    lng: 39.1728,
    finish: "لوكس",
    services: ["مسجد", "مدارس", "سوبرماركت", "صيدلية"],
    features: ["مطبخ راكب", "غرفة خادمة", "موقف سيارة", "مصعد"],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    phone: "0555000002",
    available: true,
  },
  {
    id: "re-003",
    title: "دوبلكس 5 غرف في حي النزهة",
    type: "دوبلكس",
    purpose: "بيع",
    price: 1_100_000,
    area: 280,
    rooms: 5,
    bathrooms: 4,
    floors: 2,
    age: 2,
    district: "النزهة",
    city: "جدة",
    lat: 21.57,
    lng: 39.15,
    finish: "سوبر لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "حدائق"],
    features: ["مجلس مستقل", "مطبخ راكب", "موقف سيارتين", "تراس"],
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    phone: "0555000003",
    available: true,
  },
  {
    id: "re-004",
    title: "شقة 3 غرف للإيجار في حي الخمرة",
    type: "شقة",
    purpose: "إيجار",
    price: 32_000,
    area: 140,
    rooms: 3,
    bathrooms: 2,
    age: 7,
    district: "الخمرة",
    city: "جدة",
    lat: 21.52,
    lng: 39.21,
    finish: "عادي",
    services: ["مسجد", "سوبرماركت", "صيدلية", "مدارس"],
    features: ["موقف سيارة", "مصعد"],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    phone: "0555000004",
    available: true,
  },
  {
    id: "re-005",
    title: "فيلا 7 غرف في حي الزهراء",
    type: "فيلا",
    purpose: "بيع",
    price: 3_500_000,
    area: 600,
    rooms: 7,
    bathrooms: 6,
    floors: 3,
    age: 1,
    district: "الزهراء",
    city: "جدة",
    lat: 21.59,
    lng: 39.13,
    finish: "سوبر لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "مول", "نادي رياضي"],
    features: [
      "مسبح",
      "مجلس مستقل",
      "غرفة سائق",
      "غرفة خادمة",
      "مطبخ راكب",
      "حديقة",
      "موقف 4 سيارات",
      "مصعد",
    ],
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    phone: "0555000005",
    available: true,
  },
  {
    id: "re-006",
    title: "شقة 2 غرف للإيجار في حي السلامة",
    type: "شقة",
    purpose: "إيجار",
    price: 22_000,
    area: 100,
    rooms: 2,
    bathrooms: 2,
    age: 10,
    district: "السلامة",
    city: "جدة",
    lat: 21.56,
    lng: 39.19,
    finish: "عادي",
    services: ["مسجد", "سوبرماركت"],
    features: ["موقف سيارة"],
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    phone: "0555000006",
    available: true,
  },
  {
    id: "re-007",
    title: "أرض تجارية في حي العزيزية",
    type: "أرض",
    purpose: "بيع",
    price: 4_200_000,
    area: 1200,
    rooms: 0,
    bathrooms: 0,
    age: 0,
    district: "العزيزية",
    city: "جدة",
    lat: 21.51,
    lng: 39.23,
    finish: "نظام",
    services: ["طريق رئيسي", "كهرباء", "ماء"],
    features: ["واجهة تجارية", "مخطط معتمد", "صك"],
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    phone: "0555000007",
    available: true,
  },
  {
    id: "re-008",
    title: "دوبلكس 4 غرف في حي الصفا",
    type: "دوبلكس",
    purpose: "إيجار",
    price: 55_000,
    area: 220,
    rooms: 4,
    bathrooms: 3,
    floors: 2,
    age: 4,
    district: "الصفا",
    city: "جدة",
    lat: 21.58,
    lng: 39.16,
    finish: "لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "مول"],
    features: ["مجلس مستقل", "مطبخ راكب", "موقف سيارتين", "تراس", "مصعد"],
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    phone: "0555000008",
    available: true,
  },
  {
    id: "re-009",
    title: "فيلا 5 غرف في حي الحمراء",
    type: "فيلا",
    purpose: "إيجار",
    price: 120_000,
    area: 380,
    rooms: 5,
    bathrooms: 4,
    floors: 2,
    age: 6,
    district: "الحمراء",
    city: "جدة",
    lat: 21.55,
    lng: 39.18,
    finish: "لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "سوبرماركت", "نادي"],
    features: ["مسبح", "مجلس مستقل", "غرفة سائق", "حديقة", "موقف 3 سيارات"],
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    phone: "0555000009",
    available: true,
  },
  {
    id: "re-010",
    title: "شقة 5 غرف في حي الربوة",
    type: "شقة",
    purpose: "بيع",
    price: 950_000,
    area: 230,
    rooms: 5,
    bathrooms: 4,
    age: 3,
    district: "الربوة",
    city: "جدة",
    lat: 21.565,
    lng: 39.145,
    finish: "سوبر لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "مول", "حدائق"],
    features: ["مطبخ راكب", "غرفة خادمة", "موقف سيارتين", "مصعد", "تراس"],
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    phone: "0555000010",
    available: true,
  },
  {
    id: "re-011",
    title: "استوديو للإيجار في حي البلد",
    type: "استوديو",
    purpose: "إيجار",
    price: 14_000,
    area: 55,
    rooms: 1,
    bathrooms: 1,
    age: 15,
    district: "البلد",
    city: "جدة",
    lat: 21.4858,
    lng: 39.1925,
    finish: "عادي",
    services: ["مسجد", "سوبرماركت", "مطاعم"],
    features: ["مفروش جزئياً"],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    phone: "0555000011",
    available: true,
  },
  {
    id: "re-012",
    title: "فيلا 6 غرف في حي الفيصلية",
    type: "فيلا",
    purpose: "بيع",
    price: 2_200_000,
    area: 400,
    rooms: 6,
    bathrooms: 5,
    floors: 2,
    age: 8,
    district: "الفيصلية",
    city: "جدة",
    lat: 21.535,
    lng: 39.165,
    finish: "لوكس",
    services: ["مسجد", "مدارس", "مستشفى", "سوبرماركت"],
    features: ["مجلس مستقل", "غرفة سائق", "مطبخ راكب", "حديقة", "موقف 3 سيارات"],
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
    phone: "0555000012",
    available: true,
  },
];

// ===== خوارزمية حساب نسبة التطابق =====

export interface PropertyRequest {
  type?: PropertyType;
  purpose: PurposeType;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  rooms: number; // الحد الأدنى
  district?: string;
  city: string;
  finish?: FinishType;
  requiredServices: string[];
  requiredFeatures: string[];
  maxAge?: number; // أقصى عمر للعقار
}

export interface MatchResult {
  listing: RealEstateListing;
  score: number; // 0-100
  breakdown: {
    label: string;
    score: number;
    weight: number;
    detail: string;
  }[];
}

const WEIGHTS = {
  purpose: 25, // الغرض (بيع/إيجار) - إلزامي
  price: 20, // السعر
  area: 15, // المساحة
  rooms: 15, // عدد الغرف
  location: 10, // الموقع/الحي
  services: 8, // الخدمات
  features: 5, // المميزات
  finish: 2, // التشطيب
};

export function calculateMatch(request: PropertyRequest, listing: RealEstateListing): MatchResult {
  const breakdown: MatchResult["breakdown"] = [];

  // 1. الغرض (إلزامي 25%)
  const purposeMatch = listing.purpose === request.purpose ? 100 : 0;
  breakdown.push({
    label: "الغرض",
    score: purposeMatch,
    weight: WEIGHTS.purpose,
    detail:
      purposeMatch === 100
        ? `✓ ${listing.purpose}`
        : `✗ العقار للـ${listing.purpose} وليس ${request.purpose}`,
  });

  // 2. نوع العقار (ضمن السعر)
  const typeBonus = !request.type || listing.type === request.type ? 100 : 60;

  // 3. السعر (20%)
  let priceScore = 0;
  if (listing.price >= request.minPrice && listing.price <= request.maxPrice) {
    priceScore = 100;
  } else if (listing.price < request.minPrice) {
    const diff = (request.minPrice - listing.price) / request.minPrice;
    priceScore = Math.max(0, 100 - diff * 200);
  } else {
    const diff = (listing.price - request.maxPrice) / request.maxPrice;
    priceScore = Math.max(0, 100 - diff * 150);
  }
  const formattedPrice = listing.price.toLocaleString("ar-SA");
  breakdown.push({
    label: "السعر",
    score: priceScore,
    weight: WEIGHTS.price,
    detail:
      priceScore >= 90
        ? `✓ ${formattedPrice} ر.س — ضمن الميزانية`
        : `${formattedPrice} ر.س — ${listing.price > request.maxPrice ? "أعلى من الميزانية" : "أقل من المتوقع"}`,
  });

  // 4. المساحة (15%)
  let areaScore = 0;
  if (listing.area >= request.minArea && listing.area <= request.maxArea) {
    areaScore = 100;
  } else if (listing.area < request.minArea) {
    const diff = (request.minArea - listing.area) / request.minArea;
    areaScore = Math.max(0, 100 - diff * 200);
  } else {
    const diff = (listing.area - request.maxArea) / request.maxArea;
    areaScore = Math.max(0, 100 - diff * 100);
  }
  breakdown.push({
    label: "المساحة",
    score: areaScore,
    weight: WEIGHTS.area,
    detail:
      areaScore >= 90
        ? `✓ ${listing.area} م² — مناسبة`
        : `${listing.area} م² — ${listing.area < request.minArea ? "أصغر من المطلوب" : "أكبر من المطلوب"}`,
  });

  // 5. عدد الغرف (15%)
  let roomsScore = 0;
  if (listing.rooms >= request.rooms) {
    roomsScore = listing.rooms === request.rooms ? 100 : 85;
  } else {
    const diff = request.rooms - listing.rooms;
    roomsScore = Math.max(0, 100 - diff * 30);
  }
  breakdown.push({
    label: "عدد الغرف",
    score: roomsScore,
    weight: WEIGHTS.rooms,
    detail:
      roomsScore >= 90
        ? `✓ ${listing.rooms} غرف — مطابق`
        : `${listing.rooms} غرف (المطلوب ${request.rooms}+)`,
  });

  // 6. الموقع/الحي (10%)
  let locationScore = 60; // افتراضي - نفس المدينة
  if (listing.city !== request.city) {
    locationScore = 0;
  } else if (request.district && listing.district === request.district) {
    locationScore = 100;
  } else if (request.district) {
    locationScore = 50;
  } else {
    locationScore = 80;
  }
  breakdown.push({
    label: "الموقع",
    score: locationScore,
    weight: WEIGHTS.location,
    detail: locationScore === 100 ? `✓ حي ${listing.district} — المطلوب` : `حي ${listing.district}`,
  });

  // 7. الخدمات (8%)
  let servicesScore = 100;
  if (request.requiredServices.length > 0) {
    const matched = request.requiredServices.filter((s) =>
      listing.services.some((ls) => ls.includes(s) || s.includes(ls)),
    ).length;
    servicesScore = Math.round((matched / request.requiredServices.length) * 100);
  }
  breakdown.push({
    label: "الخدمات",
    score: servicesScore,
    weight: WEIGHTS.services,
    detail:
      servicesScore === 100
        ? `✓ جميع الخدمات متوفرة`
        : `${Math.round((servicesScore / 100) * request.requiredServices.length)}/${request.requiredServices.length} خدمات متوفرة`,
  });

  // 8. المميزات (5%)
  let featuresScore = 100;
  if (request.requiredFeatures.length > 0) {
    const matched = request.requiredFeatures.filter((f) =>
      listing.features.some((lf) => lf.includes(f) || f.includes(lf)),
    ).length;
    featuresScore = Math.round((matched / request.requiredFeatures.length) * 100);
  }
  breakdown.push({
    label: "المميزات",
    score: featuresScore,
    weight: WEIGHTS.features,
    detail:
      featuresScore === 100
        ? `✓ جميع المميزات متوفرة`
        : `${Math.round((featuresScore / 100) * request.requiredFeatures.length)}/${request.requiredFeatures.length} مميزات متوفرة`,
  });

  // 9. التشطيب (2%)
  const finishScore =
    !request.finish || listing.finish === request.finish
      ? 100
      : request.finish === "سوبر لوكس" && listing.finish === "لوكس"
        ? 70
        : 40;
  breakdown.push({
    label: "التشطيب",
    score: finishScore,
    weight: WEIGHTS.finish,
    detail:
      finishScore === 100
        ? `✓ ${listing.finish}`
        : `${listing.finish} (المطلوب ${request.finish ?? "أي"})`,
  });

  // حساب النسبة الإجمالية مع مراعاة نوع العقار
  const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const weightedScore =
    breakdown.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
  const finalScore = Math.round(weightedScore * (typeBonus / 100));

  // إذا كان الغرض غير مطابق، النسبة لا تتجاوز 30%
  const adjustedScore = purposeMatch === 0 ? Math.min(finalScore, 30) : finalScore;

  return {
    listing,
    score: adjustedScore,
    breakdown,
  };
}

export function findMatches(request: PropertyRequest): MatchResult[] {
  return realEstateListings
    .filter((l) => l.available)
    .map((l) => calculateMatch(request, l))
    .filter((r) => r.score >= 50) // فقط النتائج ذات الصلة
    .sort((a, b) => b.score - a.score);
}

export const DISTRICTS_JEDDAH = [
  "الشاطئ",
  "الروضة",
  "النزهة",
  "الخمرة",
  "الزهراء",
  "السلامة",
  "العزيزية",
  "الصفا",
  "الحمراء",
  "الربوة",
  "البلد",
  "الفيصلية",
  "الأندلس",
  "المروة",
  "الرحاب",
  "الواحة",
  "الريان",
  "الفيحاء",
  "الجوهرة",
  "الكندرة",
  "الثغر",
  "الورود",
  "المحمدية",
  "الزمرد",
];

export const SERVICES_LIST = [
  "مسجد",
  "مدارس",
  "مستشفى",
  "سوبرماركت",
  "مول",
  "صيدلية",
  "حدائق",
  "نادي رياضي",
  "كورنيش",
  "أمن",
  "طريق رئيسي",
];

export const FEATURES_LIST = [
  "مسبح",
  "مجلس مستقل",
  "غرفة سائق",
  "غرفة خادمة",
  "مطبخ راكب",
  "حديقة",
  "موقف سيارة",
  "موقف سيارتين",
  "موقف 3 سيارات",
  "مصعد",
  "تراس",
  "مفروش",
  "مفروش جزئياً",
];
