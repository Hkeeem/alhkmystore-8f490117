export type Tool = {
  id: string;
  title: string;
  icon: string;
  badge?: { label: string; tone: "new" | "active" | "pinned" };
  favorite?: boolean;
};

export type PinnedTool = { id: string; title: string; icon: "wand" | "chat" | "platform"; badge?: string };
export type PlatformSection = { title: string; items: string[] };
export type SmartBot = { name: string; emoji: string };

export const tools: Tool[] = [
  { id: "smart-search", title: "البحث الذكي بالعروض", icon: "🔎", badge: { label: "نشطة", tone: "active" }, favorite: true },
  { id: "image-search", title: "البحث بالصورة", icon: "📷", badge: { label: "جديد", tone: "new" }, favorite: true },
  { id: "price-compare", title: "مقارنة الأسعار", icon: "⚖️", badge: { label: "نشطة", tone: "active" } },
  { id: "coupon-finder", title: "صياد الكوبونات", icon: "🎟️", badge: { label: "مميزة", tone: "pinned" } },
  { id: "cashback", title: "حاسبة الكاش باك", icon: "💰" },
  { id: "smart-list", title: "قائمة التسوق الذكية", icon: "🛒" },
  { id: "nearby", title: "العروض القريبة", icon: "📍" },
  { id: "deal-alerts", title: "تنبيهات العروض", icon: "🔔", badge: { label: "نشطة", tone: "active" } },
  { id: "real-estate", title: "مساعد العقارات", icon: "🏢" },
  { id: "merchant", title: "أدوات التاجر", icon: "🏪" },
  { id: "analytics", title: "تحليل السوق", icon: "📊" },
  { id: "ai-chat", title: "مساعد حكيم", icon: "💬", badge: { label: "مميزة", tone: "pinned" }, favorite: true },
  { id: "agents", title: "وكلاء حكيم الآليون", icon: "🤖", badge: { label: "جديد", tone: "new" } },
];

export const pinnedTools: PinnedTool[] = [
  { id: "pinned-assistant", title: "مساعد حكيم الذكي", icon: "chat", badge: "الأكثر استخدامًا" },
  { id: "pinned-search", title: "البحث الذكي عن العروض", icon: "wand", badge: "سريع" },
  { id: "pinned-platform", title: "منصة حكيم AI", icon: "platform", badge: "الرئيسية" },
];

export const platformSections: PlatformSection[] = [
  { title: "منصة حكيم AI", items: ["العروض والكوبونات", "مقارنة الأسعار", "الكاش باك", "تواصل معنا"] },
];

export const smartBots: SmartBot[] = [
  { name: "بوت البحث عن العروض", emoji: "🔎" },
  { name: "بوت إدخال العقارات", emoji: "🏢" },
  { name: "بوت تنبيهات الخصومات", emoji: "🔔" },
];

export const filterDefinitions = [
  { key: "all", label: "الكل", count: tools.length },
  { key: "search", label: "بحث واستكشاف", count: 4 },
  { key: "code", label: "برمجة </>" },
];
