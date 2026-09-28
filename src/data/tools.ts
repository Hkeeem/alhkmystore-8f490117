export type ToolCategory =
  | "search"
  | "shopping"
  | "property"
  | "business"
  | "assistant";

export type ToolSubcategory =
  | "offers"
  | "prices"
  | "images"
  | "coupons"
  | "real-estate"
  | "analytics"
  | "automation";

export type Tool = {
  id: string;
  title: string;
  icon: string;
  category: ToolCategory;
  subcategory: ToolSubcategory;
  description?: string;
  href?: string;
  badge?: {
    label: string;
    tone: "new" | "active" | "pinned";
  };
  favorite?: boolean;
};

export type PinnedTool = { 
  id: string; 
  title: string; 
  icon: "wand" | "chat" | "platform"; 
  badge?: string; 
  href?: string;
};

export type PlatformSection = { title: string; items: string[] };
export type SmartBot = { name: string; emoji: string };

export const tools: Tool[] = [
  {
    id: "smart-search",
    title: "البحث الذكي بالعروض",
    icon: "🔎",
    category: "search",
    subcategory: "offers",
    description: "استكشف أحدث عروض المقاضي والأسواق بذكاء",
    href: "/chat",
    badge: { label: "نشطة", tone: "active" },
    favorite: true,
  },
  {
    id: "image-search",
    title: "البحث بالصورة",
    icon: "📷",
    category: "search",
    subcategory: "images",
    description: "ابحث عن المنتجات عبر التقاط صورة لها",
    href: "/chat",
    badge: { label: "جديد", tone: "new" },
    favorite: true,
  },
  {
    id: "price-compare",
    title: "مقارنة الأسعار",
    icon: "⚖️",
    category: "search",
    subcategory: "prices",
    description: "قارن أسعار المقاضي بين المتاجر بسهولة",
    href: "/",
    badge: { label: "نشطة", tone: "active" },
  },
  {
    id: "coupon-finder",
    title: "صياد الكوبونات",
    icon: "🎟️",
    category: "shopping",
    subcategory: "coupons",
    description: "احصل على أقوى كوبونات الخصم الفعالة",
    href: "/",
    badge: { label: "مميزة", tone: "pinned" },
  },
  {
    id: "cashback",
    title: "حاسبة الكاش باك",
    icon: "💰",
    category: "shopping",
    subcategory: "coupons",
    description: "احسب نسبة التوفير والكاش باك لكل عملية",
    href: "/",
  },
  {
    id: "smart-list",
    title: "قائمة التسوق الذكية",
    icon: "🛒",
    category: "shopping",
    subcategory: "offers",
    description: "جهز مقاضيك ونظم مشترياتك بذكاء",
    href: "/",
  },
  {
    id: "deal-alerts",
    title: "تنبيهات العروض",
    icon: "🔔",
    category: "shopping",
    subcategory: "offers",
    description: "تنبيهات فورية عند انخفاض أسعار مقاضيك",
    href: "/",
    badge: { label: "نشطة", tone: "active" },
  },
  {
    id: "real-estate",
    title: "مساعد العقارات",
    icon: "🏢",
    category: "property",
    subcategory: "real-estate",
    description: "استشارات وتسويق عقاري مرن",
    href: "/real-estate",
  },
  {
    id: "property-analyzer",
    title: "محلل العقارات",
    icon: "🏠",
    category: "property",
    subcategory: "real-estate",
    description: "حلّل مواصفات العقار والسعر المتوقع",
    href: "/real-estate",
  },
  {
    id: "merchant",
    title: "أدوات التاجر",
    icon: "🏪",
    category: "business",
    subcategory: "analytics",
    description: "أدوات خاصة بالشركاء وأصحاب المتاجر",
    href: "/merchant",
  },
  {
    id: "store-dashboard",
    title: "لوحة التاجر الذكية",
    icon: "📈",
    category: "business",
    subcategory: "analytics",
    description: "تابع أداء منتجاتك وعروضك التسويقية",
    href: "/merchant",
  },
  {
    id: "analytics",
    title: "تحليل السوق",
    icon: "📊",
    category: "business",
    subcategory: "analytics",
    description: "قراءات تحليلية لحركة السوق والعروض",
    href: "/merchant",
  },
  {
    id: "voice-search",
    title: "البحث الصوتي",
    icon: "🎙️",
    category: "search",
    subcategory: "offers",
    description: "ابحث عن العروض والمقاضي باستخدام صوتك",
    href: "/chat",
    badge: { label: "جديد", tone: "new" },
  },
  {
    id: "ai-chat",
    title: "مساعد حكيم",
    icon: "💬",
    category: "assistant",
    subcategory: "automation",
    description: "مساعدك الذكي لكل ما تحتاجه",
    href: "/chat",
    badge: { label: "مميزة", tone: "pinned" },
    favorite: true,
  },
  {
    id: "agents",
    title: "وكلاء حكيم الآليون",
    icon: "🤖",
    category: "assistant",
    subcategory: "automation",
    description: "فريق من الوكلاء لتنفيذ مهامك التلقائية",
    href: "/chat",
    badge: { label: "جديد", tone: "new" },
  },
];

export const categoryDefinitions = [
  { key: "all", label: "الكل" },
  { key: "search", label: "البحث والاستكشاف" },
  { key: "shopping", label: "التسوق والتوفير" },
  { key: "property", label: "العقارات" },
  { key: "business", label: "التجار والتحليلات" },
  { key: "assistant", label: "المساعدات الذكية" },
] as const;

export const subcategoryDefinitions = [
  { key: "all", label: "كل التصنيفات الفرعية" },
  { key: "offers", label: "العروض" },
  { key: "prices", label: "مقارنة الأسعار" },
  { key: "images", label: "البحث بالصور" },
  { key: "coupons", label: "الكوبونات" },
  { key: "real-estate", label: "البحث العقاري" },
  { key: "analytics", label: "التحليلات" },
  { key: "automation", label: "الأتمتة والبوتات" },
] as const;

export const pinnedTools: PinnedTool[] = [
  { id: "pinned-assistant", title: "مساعد حكيم الذكي", icon: "chat", badge: "الأكثر استخدامًا", href: "/chat" },
  { id: "pinned-search", title: "البحث الذكي عن العروض", icon: "wand", badge: "سريع", href: "/chat" },
  { id: "pinned-platform", title: "منصة حكيم AI", icon: "platform", badge: "الرئيسية", href: "/" },
];

export const platformSections: PlatformSection[] = [
  { title: "منصة حكيم AI", items: ["العروض والكوبونات", "مقارنة الأسعار", "الكاش باك", "تواصل معنا"] },
];

export const smartBots: SmartBot[] = [
  { name: "بوت البحث عن العروض", emoji: "🔎" },
  { name: "بوت إدخال العقارات", emoji: "🏢" },
  { name: "بوت تنبيهات الخصومات", emoji: "🔔" },
];
