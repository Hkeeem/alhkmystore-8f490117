import { stores } from "./deals";

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
};

export const coupons: Coupon[] = [
  { id: "c1", storeId: "hunger", code: "HS30", title: "خصم 30% على أول طلب", description: "صالح على جميع المطاعم عبر تطبيق هنقرستيشن", discount: "30%", minOrder: 40, expiresIn: "5 أيام", category: "أول طلب" },
  { id: "c2", storeId: "jahez", code: "JAHEZ25", title: "خصم 25 ر.س", description: "على الطلبات فوق 60 ر.س من المطاعم المشاركة", discount: "25 ر.س", minOrder: 60, expiresIn: "أسبوع", category: "خصم عام" },
  { id: "c3", storeId: "toshel", code: "FREESHIP", title: "شحن مجاني", description: "توصيل مجاني لجميع الطلبات هذا الأسبوع", discount: "شحن مجاني", expiresIn: "3 أيام", category: "شحن مجاني" },
  { id: "c4", storeId: "noon", code: "NOON50", title: "خصم 50 ر.س", description: "على الإلكترونيات بحد أدنى 300 ر.س", discount: "50 ر.س", minOrder: 300, expiresIn: "أسبوعان", category: "خصم عام" },
  { id: "c5", storeId: "amazon", code: "SAR40OFF", title: "خصم 40 ر.س", description: "للطلبات الجديدة على أمازون السعودية", discount: "40 ر.س", minOrder: 200, expiresIn: "10 أيام", category: "أول طلب" },
  { id: "c6", storeId: "jarir", code: "JARIR10", title: "خصم 10%", description: "على القرطاسية والكتب فقط", discount: "10%", expiresIn: "أسبوع", category: "خصم عام" },
  { id: "c7", storeId: "extra", code: "EXTRA15", title: "خصم 15%", description: "على الأجهزة المنزلية الصغيرة", discount: "15%", minOrder: 500, expiresIn: "5 أيام", category: "خصم عام" },
  { id: "c8", storeId: "nahdi", code: "NAHDI20", title: "خصم 20%", description: "على منتجات العناية الشخصية", discount: "20%", expiresIn: "أسبوع", category: "خصم عام" },
  { id: "c9", storeId: "dawaa", code: "DAWAA15", title: "خصم 15 ر.س", description: "على الفيتامينات والمكملات", discount: "15 ر.س", minOrder: 80, expiresIn: "أسبوعان", category: "خصم عام" },
  { id: "c10", storeId: "othaim", code: "OTH10", title: "خصم 10%", description: "خصم إضافي على العروض الأسبوعية", discount: "10%", minOrder: 150, expiresIn: "3 أيام", category: "حصري" },
  { id: "c11", storeId: "panda", code: "PANDA20", title: "خصم 20 ر.س", description: "على طلبات بنده أونلاين", discount: "20 ر.س", minOrder: 120, expiresIn: "أسبوع", category: "خصم عام" },
  { id: "c12", storeId: "lulu", code: "LULU25", title: "خصم 25 ر.س", description: "خصم حصري لعملاء وفّر", discount: "25 ر.س", minOrder: 150, expiresIn: "5 أيام", category: "حصري" },
  { id: "c13", storeId: "danube", code: "DANUBE12", title: "خصم 12%", description: "على قسم المخبوزات والأجبان", discount: "12%", expiresIn: "أسبوع", category: "خصم عام" },
  { id: "c14", storeId: "tamimi", code: "TAM15", title: "خصم 15 ر.س", description: "على طلبات التميمي أونلاين", discount: "15 ر.س", minOrder: 100, expiresIn: "أسبوعان", category: "خصم عام" },
];

export function storeById(id: string) {
  return stores.find((s) => s.id === id);
}
