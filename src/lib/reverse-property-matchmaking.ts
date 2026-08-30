export type BuyerMatch = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  district: string;
  property_type: string;
  purpose: "شراء" | "إيجار";
  max_price: number;
  min_bedrooms: number;
  features: string[];
  required_services: string[];
  match_score: number;
  is_demo: boolean;
  created_at: string;
};

export const PROPERTY_TYPES = ["شقة", "فيلا", "دوبلكس", "أرض", "استوديو", "مكتب"] as const;
export const PURPOSES = ["شراء", "إيجار"] as const;
export const SERVICES = [
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
] as const;
export const FEATURES = [
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
] as const;

export function normalizeSaudiPhone(phone: string): string | null {
  const compact = phone.replace(/[\s()-]/g, "");
  if (/^05\d{8}$/.test(compact)) return `966${compact.slice(1)}`;
  if (/^9665\d{8}$/.test(compact)) return compact;
  if (/^\+9665\d{8}$/.test(compact)) return compact.slice(1);
  return null;
}

export function createWhatsAppMatchLink(match: BuyerMatch, property: { city: string; district: string; propertyType: string; price: number; bedrooms: number }): string | null {
  if (match.is_demo) return null;
  const phone = normalizeSaudiPhone(match.phone);
  if (!phone) return null;
  const message = [
    `السلام عليكم ${match.full_name}،`,
    `لدينا عقار متوافق مع طلبك بنسبة ${match.match_score}% عبر HkeeemAI.`,
    `النوع: ${property.propertyType} | الموقع: ${property.district}، ${property.city}.`,
    `السعر: ${property.price.toLocaleString("ar-SA")} ر.س | الغرف: ${property.bedrooms}.`,
    "هل تود الاطلاع على التفاصيل؟",
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function scoreTone(score: number): "success" | "warning" | "neutral" {
  if (score >= 85) return "success";
  if (score >= 65) return "warning";
  return "neutral";
}

export function toggleSelection(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
