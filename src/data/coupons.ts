import { stores } from "./deals";
import { SHOW_DEMO_DATA } from "@/lib/data-policy";

export type Coupon = {
  id: string;
  storeId: string;
  code: string;
  title: string;
  description: string;
  discount: string; // e.g. "20%" or "50 ر.س"
  minOrder?: number;
  expiresIn: string;
  category?: "أول طلب" | "شحن مجاني" | "خصم عام" | "حصري";
  verifiedAt?: string;
  source?: string;
};

const demoCoupons: Coupon[] = [
  {
    id: "v1",
    storeId: "noon",
    code: "ALC59",
    title: "كاش باك 10% على أول طلب",
    description: "كاش باك 10% للعملاء الجدد و5% للحاليين في تطبيق نون السعودية",
    discount: "10%",
    expiresIn: "2026-12-31",
    category: "أول طلب",
    verifiedAt: "2026-09-27",
    source: "https://saudi.alcoupon.com/ar/discount-codes/noon",
  },
  {
    id: "v2",
    storeId: "shein",
    code: "MEAF25",
    title: "خصم حتى 30% للعملاء الجدد",
    description: "30% للجدد و15% للحاليين على طلبات شي إن السعودية",
    discount: "30%",
    expiresIn: "2026-12-31",
    category: "خصم عام",
    verifiedAt: "2026-09-27",
    source: "https://couponzil.com/store/shein-discount-code/",
  },
  {
    id: "v3",
    storeId: "amazon",
    code: "SNB25",
    title: "خصم 25% إضافي لبطاقات SNB",
    description: "لحاملي بطاقات البنك الأهلي السعودي الائتمانية على أمازون السعودية",
    discount: "25%",
    expiresIn: "2026-09-30",
    category: "حصري",
    verifiedAt: "2026-09-27",
    source: "https://almowafir.com/store/amazon/",
  },
  {
    id: "c1",
    storeId: "hunger",
    code: "HS30",
    title: "خصم 30% على أول طلب",
    description: "صالح على جميع المطاعم عبر تطبيق هنقرستيشن",
    discount: "30%",
    minOrder: 40,
    expiresIn: "5 أيام",
    category: "أول طلب",
  },
  {
    id: "c2",
    storeId: "jahez",
    code: "JAHEZ25",
    title: "خصم 25 ر.س",
    description: "على الطلبات فوق 60 ر.س من المطاعم المشاركة",
    discount: "25 ر.س",
    minOrder: 60,
    expiresIn: "أسبوع",
    category: "خصم عام",
  },
  {
    id: "c3",
    storeId: "toshel",
    code: "FREESHIP",
    title: "شحن مجاني",
    description: "توصيل مجاني لجميع الطلبات هذا الأسبوع",
    discount: "شحن مجاني",
    expiresIn: "3 أيام",
    category: "شحن مجاني",
  },
  {
    id: "c10",
    storeId: "othaim",
    code: "OTH10",
    title: "خصم 10%",
    description: "خصم إضافي على العروض الأسبوعية",
    discount: "10%",
    minOrder: 150,
    expiresIn: "3 أيام",
    category: "حصري",
  },
  {
    id: "c11",
    storeId: "panda",
    code: "PANDA20",
    title: "خصم 20 ر.س",
    description: "على طلبات بنده أونلاين",
    discount: "20 ر.س",
    minOrder: 120,
    expiresIn: "أسبوع",
    category: "خصم عام",
  },
];

export function storeById(id: string) {
  return stores.find((s) => s.id === id);
}

export const coupons: Coupon[] = SHOW_DEMO_DATA ? demoCoupons : [];
