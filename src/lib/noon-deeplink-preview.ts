/**
 * معاينة الرابط العميق لحملة نون قبل تأكيد الحفظ.
 * تحاكي بالضبط ما يبنيه المسار /api/public/go/:dealId على الخادم
 * (انظر decorate() في src/routes/api/public/go.$dealId.ts).
 */

export type DeepLinkParam = {
  key: string;
  value: string;
  label: string;
};

export type NoonDeepLinkPreview = {
  url: string;
  destinationHost: string;
  params: DeepLinkParam[];
  clickId: string;
  redirectUrl: string;
  valid: boolean;
};

export const SAMPLE_PRODUCT_URL = "https://www.noon.com/saudi-ar/p/?sku=N53442298A";
export const SAMPLE_DEAL_ID = "00000000-1111-2222-3333-444455556666";
/** معرّف نقرة تجريبي بنفس صيغة المعرّفات الحقيقية (uuid) */
export const SAMPLE_CLICK_ID = "9f1c7b64-3a20-4d8e-b1a5-7c2e5d904af3";

export function buildNoonDeepLinkPreview(opts: {
  publisherId: string;
  productUrl?: string;
  dealId?: string;
  clickId?: string;
  origin?: string;
}): NoonDeepLinkPreview {
  const publisherId = opts.publisherId.trim();
  const dealId = opts.dealId ?? SAMPLE_DEAL_ID;
  const clickId = opts.clickId ?? SAMPLE_CLICK_ID;
  const origin = opts.origin ?? "";

  let url: URL;
  try {
    url = new URL(opts.productUrl ?? SAMPLE_PRODUCT_URL);
  } catch {
    url = new URL(SAMPLE_PRODUCT_URL);
  }

  const params: DeepLinkParam[] = [];
  const set = (key: string, value: string, label: string) => {
    url.searchParams.set(key, value);
    params.push({ key, value, label });
  };

  if (publisherId) set("utm_source", publisherId, "معرّف الناشر (Publisher ID) المرسل لنون");
  set("subid", clickId, "معرّف النقرة الذي تُرجعه الشبكة في Postback");
  set("utm_medium", "affiliate", "نوع القناة");
  set("utm_campaign", "hkeeem-ai", "اسم الحملة داخل التطبيق");
  set("utm_content", dealId, "معرّف العرض المنقور");
  set("utm_id", clickId, "نفس معرّف النقرة لمطابقة المبيعات");

  return {
    url: url.toString(),
    destinationHost: url.hostname,
    params,
    clickId,
    redirectUrl: `${origin}/api/public/go/${dealId}`,
    valid: /^[A-Za-z0-9._-]{3,64}$/.test(publisherId),
  };
}
