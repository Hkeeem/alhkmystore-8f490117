/**
 * وكلاء حكيم AI الثلاثة — محرك خالص (بدون واجهة) يعمل على العروض الحقيقية فقط:
 *  - حارس حكيم (Guard): يفحص العروض ويحجب المشبوه/المنتهي/الرابط غير الآمن.
 *  - الصياد (Hunter): يصطاد أقوى العروض بترتيب ذكي مع سبب واضح.
 *  - ناشر حكيم (Publisher): يجهّز نص نشر عربي جاهز لكل منصة.
 */

export type AgentId = "guard" | "hunter" | "publisher";

export type AgentState = Record<AgentId, boolean>;

export const AGENT_LABEL: Record<AgentId, string> = {
  guard: "حارس حكيم",
  hunter: "الصياد",
  publisher: "ناشر حكيم",
};

export const AGENT_DESC: Record<AgentId, string> = {
  guard: "يفحص كل عرض قبل عرضه: روابط آمنة، أسعار منطقية، وصلاحية سارية.",
  hunter: "يصطاد أقوى العروض ويرتّبها حسب التوفير والاستعجال والتفاعل.",
  publisher: "يكتب منشوراً عربياً جاهزاً لكل عرض قوي للمشاركة فوراً.",
};

const STORAGE_KEY = "hkeeem-agents-v1";
const DEFAULT_STATE: AgentState = { guard: true, hunter: true, publisher: true };

export function readAgentState(): AgentState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AgentState>;
    return {
      guard: parsed.guard ?? true,
      hunter: parsed.hunter ?? true,
      publisher: parsed.publisher ?? true,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveAgentState(state: AgentState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* تجاهل امتلاء التخزين */
  }
}

/** الحد الأدنى من الحقول التي يحتاجها الوكلاء (متوافق مع عروض التجّار) */
export type AgentDeal = {
  id: string;
  title: string;
  price: number;
  original_price: number;
  discount_percent?: number | null;
  product_url?: string | null;
  expires_at?: string | null;
  clicks?: number | null;
  category?: string | null;
  storeName?: string | null;
};

export function discountOf(deal: AgentDeal): number {
  if (typeof deal.discount_percent === "number" && deal.discount_percent > 0) {
    return Math.round(deal.discount_percent);
  }
  if (deal.original_price > 0 && deal.price >= 0 && deal.original_price > deal.price) {
    return Math.round(((deal.original_price - deal.price) / deal.original_price) * 100);
  }
  return 0;
}

/* ───────────────────────── حارس حكيم ───────────────────────── */

export type GuardIssue = "expired" | "no-url" | "insecure-url" | "bad-price" | "unrealistic-discount";

export const GUARD_ISSUE_LABEL: Record<GuardIssue, string> = {
  expired: "العرض منتهي الصلاحية",
  "no-url": "لا يوجد رابط شراء موثوق",
  "insecure-url": "الرابط غير آمن (ليس HTTPS)",
  "bad-price": "السعر بعد الخصم غير منطقي",
  "unrealistic-discount": "نسبة خصم مبالغ فيها وغير موثوقة",
};

export type GuardVerdict = { deal: AgentDeal; issues: GuardIssue[]; safe: boolean };

export function guardInspect(deal: AgentDeal, now = Date.now()): GuardVerdict {
  const issues: GuardIssue[] = [];

  if (deal.expires_at) {
    const at = Date.parse(deal.expires_at);
    if (Number.isFinite(at) && at < now) issues.push("expired");
  }

  const url = (deal.product_url ?? "").trim();
  if (!url) issues.push("no-url");
  else if (!/^https:\/\//i.test(url)) issues.push("insecure-url");

  if (!(deal.original_price > 0) || deal.price <= 0 || deal.price >= deal.original_price) {
    issues.push("bad-price");
  }

  if (discountOf(deal) >= 95) issues.push("unrealistic-discount");

  return { deal, issues, safe: issues.length === 0 };
}

export function guardScan(deals: AgentDeal[], now = Date.now()) {
  const results = deals.map((d) => guardInspect(d, now));
  return {
    safe: results.filter((r) => r.safe).map((r) => r.deal),
    blocked: results.filter((r) => !r.safe),
  };
}

/* ───────────────────────── الصياد ───────────────────────── */

const W_DISCOUNT = 0.5;
const W_URGENCY = 0.25;
const W_POPULARITY = 0.25;

export function hoursLeft(deal: AgentDeal, now = Date.now()): number | null {
  if (!deal.expires_at) return null;
  const at = Date.parse(deal.expires_at);
  if (!Number.isFinite(at)) return null;
  return (at - now) / 3_600_000;
}

export function hunterScore(deal: AgentDeal, maxClicks: number, now = Date.now()): number {
  const discount = Math.min(1, discountOf(deal) / 70);
  const hrs = hoursLeft(deal, now);
  const urgency = hrs === null ? 0 : hrs <= 0 ? 0 : Math.max(0, Math.min(1, (72 - hrs) / 72));
  const popularity = maxClicks > 0 ? Math.min(1, (deal.clicks ?? 0) / maxClicks) : 0;
  return discount * W_DISCOUNT + urgency * W_URGENCY + popularity * W_POPULARITY;
}

export type HuntedDeal = { deal: AgentDeal; score: number; reason: string };

export function hunt(deals: AgentDeal[], limit = 6, now = Date.now()): HuntedDeal[] {
  const maxClicks = Math.max(0, ...deals.map((d) => d.clicks ?? 0));
  return deals
    .map((deal) => ({
      deal,
      score: hunterScore(deal, maxClicks, now),
      reason: huntReason(deal, maxClicks, now),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function huntReason(deal: AgentDeal, maxClicks: number, now = Date.now()): string {
  const hrs = hoursLeft(deal, now);
  if (hrs !== null && hrs > 0 && hrs <= 24) return "ينتهي خلال ٢٤ ساعة";
  if (discountOf(deal) >= 50) return "توفير مرتفع جداً";
  if (maxClicks > 0 && (deal.clicks ?? 0) >= maxClicks * 0.7) return "الأكثر تفاعلاً الآن";
  if (discountOf(deal) >= 25) return "توفير جيد";
  return "عرض موثوق من تاجر معتمد";
}

/* ───────────────────────── ناشر حكيم ───────────────────────── */

export type PublishChannel = "whatsapp" | "telegram" | "x" | "snapchat";

export const CHANNEL_LABEL: Record<PublishChannel, string> = {
  whatsapp: "واتساب",
  telegram: "تيليجرام",
  x: "إكس",
  snapchat: "سناب شات",
};

export function buildPublishPost(
  deal: AgentDeal,
  channel: PublishChannel,
  link: string,
  now = Date.now(),
): string {
  const off = discountOf(deal);
  const saving = Math.max(0, Math.round(deal.original_price - deal.price));
  const store = deal.storeName ? ` من ${deal.storeName}` : "";
  const hrs = hoursLeft(deal, now);
  const urgency = hrs !== null && hrs > 0 && hrs <= 48 ? "\n⏳ ينتهي قريباً" : "";

  if (channel === "x") {
    return `🔥 ${deal.title}${store}\nخصم ${off}٪ · وفّر ${saving} ر.س\n${link}${urgency}\n#حكيم_AI #عروض_السعودية`;
  }
  if (channel === "snapchat") {
    return `🔥 ${deal.title}\nخصم ${off}٪ فقط\n${link}`;
  }
  const head = channel === "telegram" ? "📢 عرض حكيم AI" : "🛍️ عرض اليوم من حكيم AI";
  return [
    head,
    `\n${deal.title}${store}`,
    `💰 السعر: ${deal.price} ر.س بدلاً من ${deal.original_price} ر.س`,
    `📉 خصم ${off}٪ — توفير ${saving} ر.س`,
    urgency.trim(),
    `\n🔗 ${link}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function channelShareUrl(channel: PublishChannel, text: string, link: string): string {
  const t = encodeURIComponent(text);
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${t}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${t}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}`;
    case "snapchat":
      return `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(link)}`;
  }
}
