/** ضريبة القيمة المضافة في المملكة العربية السعودية */
export const VAT_RATE = 0.15;

/** يضيف ضريبة القيمة المضافة 15% على سعر غير شامل للضريبة */
export function withVat(price: number) {
  return Math.round(price * (1 + VAT_RATE) * 100) / 100;
}

/** يستخرج قيمة الضريبة من سعر شامل للضريبة */
export function vatAmount(priceIncludingVat: number) {
  return Math.round((priceIncludingVat - priceIncludingVat / (1 + VAT_RATE)) * 100) / 100;
}

export const VAT_NOTE = "الأسعار المعروضة شاملة ضريبة القيمة المضافة 15%";
