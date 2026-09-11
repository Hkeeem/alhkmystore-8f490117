import type { Deal, Store } from "@/data/deals";
import { discountPercent } from "@/data/deals";

const AR_DIGITS: Record<string, number> = {
  "١": 1,
  "٢": 2,
  "٣": 3,
  "٤": 4,
  "٥": 5,
  "٦": 6,
  "٧": 7,
  "٨": 8,
  "٩": 9,
  "٠": 0,
};

/** يحوّل نص المدة ("3 أيام"، "يومان"، "أسبوع") إلى عدد أيام تقريبي */
export function expiresInDays(expiresIn: string): number {
  const text = expiresIn.trim();

  if (text.includes("يومان") || text.includes("يومين")) return 2;
  if (text.includes("أسبوعان") || text.includes("أسبوعين")) return 14;
  if (text.includes("شهران") || text.includes("شهرين")) return 60;

  const digits = text
    .split("")
    .map((ch) => (AR_DIGITS[ch] !== undefined ? String(AR_DIGITS[ch]) : ch))
    .join("");
  const match = digits.match(/\d+/);
  const n = match ? parseInt(match[0], 10) : 1;

  if (text.includes("ساعة") || text.includes("ساعات")) return 1;
  if (text.includes("أسبوع")) return n * 7;
  if (text.includes("شهر")) return n * 30;
  return n;
}

/** تاريخ انتهاء العرض محسوب من مدة الصلاحية */
export function expiryDate(deal: Deal, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + expiresInDays(deal.expiresIn));
  return d;
}

export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** وصف كامل للعرض يُبنى من بيانات المنتج والمتجر */
export function dealDescription(deal: Deal, store: Store): string {
  const off = discountPercent(deal);
  const saved = deal.originalPrice - deal.price;
  const unit = deal.unit ? ` بحجم ${deal.unit}` : "";
  const brand = deal.brand ? ` من ${deal.brand}` : "";

  return (
    `${deal.title}${brand}${unit} متوفر الآن لدى ${store.name} ضمن قسم ${deal.category} ` +
    `بسعر ${deal.price} ر.س بدلاً من ${deal.originalPrice} ر.س، أي بخصم ${off}٪ وتوفير ${saved} ر.س على كل قطعة. ` +
    `تم التحقق من السعر ومقارنته مع بقية المتاجر المشاركة في حكيم AI لضمان حصولك على أفضل صفقة متاحة حالياً.`
  );
}

/** شروط وأحكام العرض */
export function dealTerms(deal: Deal, store: Store): string[] {
  const terms = [
    `العرض ساري داخل فروع ${store.name} والمنصات الرسمية التابعة لها فقط.`,
    "الأسعار شاملة ضريبة القيمة المضافة وقابلة للتغيير من المتجر دون إشعار مسبق.",
    "العرض ساري حتى نفاد الكمية، وقد تختلف التوفّر حسب الفرع والمنطقة.",
    "لا يمكن الجمع بين هذا العرض وعروض أو كوبونات أخرى إلا إذا نص المتجر على ذلك.",
    "حكيم AI منصة مقارنة أسعار ولا يتحمل مسؤولية تغيّر السعر لدى المتجر عند الشراء.",
  ];

  if (deal.category === "مطاعم") {
    terms.splice(2, 0, "قد تُطبق رسوم توصيل وحد أدنى للطلب حسب سياسة التطبيق.");
  }
  if (deal.category === "إلكترونيات") {
    terms.splice(2, 0, "الضمان والاستبدال يخضعان لسياسة المتجر والوكيل المعتمد.");
  }
  if (deal.category === "صيدلية") {
    terms.splice(2, 0, "بعض المنتجات تتطلب وصفة طبية ولا تشملها الاستبدالات.");
  }

  return terms;
}
