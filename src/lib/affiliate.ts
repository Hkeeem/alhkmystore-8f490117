/**
 * روابط الأفلييت في الواجهة تكون "نظيفة" — بدون وسوم أو مفاتيح حساسة.
 * كل التتبع وإضافة معرّفات الشراكة تتم على الخادم داخل /api/public/go/:dealId
 */
export function affiliateHref(dealId: string, source?: string) {
  const base = `/api/public/go/${dealId}`;
  return source ? `${base}?s=${encodeURIComponent(source)}` : base;
}

/** خصائص موصى بها لأي رابط خارجي مدفوع/بعمولة */
export const AFFILIATE_LINK_PROPS = {
  target: "_blank",
  rel: "nofollow sponsored noopener noreferrer",
  referrerPolicy: "no-referrer" as const,
};
