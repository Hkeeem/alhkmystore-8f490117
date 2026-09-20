import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

const STORAGE_KEY = "hk-lang";

/** قاموس الواجهة الأساسية — عربي/إنجليزي */
export const dict = {
  // Navigation
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.deals": { ar: "العروض", en: "Deals" },
  "nav.coupons": { ar: "كوبونات", en: "Coupons" },
  "nav.maps": { ar: "خريطتي", en: "Map" },
  "nav.list": { ar: "قائمة", en: "List" },
  "nav.rewards": { ar: "جوائز", en: "Rewards" },
  "nav.assistant": { ar: "مساعد", en: "Assistant" },
  "nav.new": { ar: "جديد", en: "New" },
  "nav.guide": { ar: "دليل", en: "Guide" },
  "nav.menu": { ar: "فتح القائمة الجانبية", en: "Open sidebar menu" },
  "nav.sidebar": { ar: "القائمة الجانبية", en: "Sidebar" },
  "nav.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "nav.account": { ar: "حسابي", en: "My account" },
  "nav.login": { ar: "دخول", en: "Sign in" },
  "nav.logout": { ar: "خروج", en: "Sign out" },
  "nav.loggedOut": { ar: "تم تسجيل الخروج", en: "Signed out" },
  "nav.tagline": { ar: "تسوّق أذكى… وفّر أكثر", en: "Shop smarter… save more" },

  // Sidebar groups
  "group.store": { ar: "متجر حكيم AI", en: "HkeeemAI Store" },
  "group.showroom": { ar: "معرض حكيم AI", en: "HkeeemAI Showroom" },
  "group.office": { ar: "مكتب حكيم AI", en: "HkeeemAI Office" },
  "group.intelligence": { ar: "ذكاء حكيم AI", en: "HkeeemAI Intelligence" },
  "item.stores": { ar: "المتاجر", en: "Stores" },
  "item.deals": { ar: "العروض", en: "Deals" },
  "item.coupons": { ar: "الكوبونات", en: "Coupons" },
  "item.merchant": { ar: "بوابة التاجر", en: "Merchant portal" },
  "item.showroom": { ar: "معرض حكيم", en: "Hkeeem showroom" },
  "item.shopping": { ar: "تسوّق حكيم", en: "Hkeeem shopping" },
  "item.cars": { ar: "السيارات", en: "Cars" },
  "item.restaurants": { ar: "عروض المطاعم", en: "Restaurant deals" },
  "item.realEstate": { ar: "البحث العقاري", en: "Real estate search" },
  "item.office": { ar: "مكتب حكيم", en: "Hkeeem office" },
  "item.propertyBot": { ar: "بوت إدخال العقارات", en: "Property entry bot" },
  "item.compare": { ar: "مقارنة الأسعار", en: "Price comparison" },
  "item.analysis": { ar: "تحليل المتاجر", en: "Store analysis" },
  "item.ads": { ar: "مولد الإعلانات", en: "Ad generator" },
  "item.market": { ar: "سوق حكيم الموحد", en: "Unified market" },
  "item.shop": { ar: "تسوّق حكيم", en: "Shop HkeeemAI" },
  "item.affiliate": { ar: "ربط أمازون ونون", en: "Amazon & noon setup" },
  "item.agents": { ar: "وكلاء حكيم", en: "Hkeeem agents" },
  "item.settings": { ar: "تخصيص المظهر", en: "Appearance" },
  "item.syncLog": { ar: "سجل المزامنة", en: "Sync log" },
  "item.admin": { ar: "لوحة التحكم", en: "Admin dashboard" },
  "item.pro": { ar: "حكيم برو", en: "Hkeeem Pro" },

  // Home / hero
  "home.badge": {
    ar: "HkeeemAI — وفّر أكثر… لا تدفع أكثر",
    en: "HkeeemAI — save more, never overpay",
  },
  "home.title1": { ar: "تسوّق ذكي…", en: "Smart shopping…" },
  "home.title2": { ar: "توفير أكثر", en: "bigger savings" },
  "home.subtitle": {
    ar: "نجمع كل العروض ونقارن الأسعار بين المتاجر لحظيًا — حتى تشتري نفس المنتج بأرخص سعر. مصلحتك أنت أولاً، لا المتجر.",
    en: "We gather every deal and compare prices across stores in real time, so you buy the same product for less. Your savings come first, not the store's.",
  },
  "home.searchPlaceholder": {
    ar: "اسأل حكيم: مثلاً «أرخص أرز بسمتي؟» أو «أفضل عرض جوال»",
    en: 'Ask Hkeeem: e.g. "cheapest basmati rice?" or "best phone deal"',
  },
  "home.searchLabel": { ar: "بحث ذكي", en: "Smart search" },
  "home.search": { ar: "ابحث", en: "Search" },
  "home.statStores": { ar: "متجر", en: "stores" },
  "home.statSaving": { ar: "متوسط التوفير", en: "avg. saving" },
  "home.statAssistant": { ar: "مساعد ذكي", en: "AI assistant" },
  "home.bestTitle": { ar: "أفضل العروض الآن", en: "Best deals right now" },
  "home.bestSubtitle": {
    ar: "مرتّبة تلقائياً حسب نسبة التوفير",
    en: "Auto-ranked by savings percentage",
  },
  "home.compareTitle": { ar: "مقارنة الأسعار", en: "Price comparison" },
  "home.compareSubtitle": {
    ar: "نفس المنتج، أرخص متجر أوّلاً",
    en: "Same product, cheapest store first",
  },
  "home.cheapest": { ar: "أرخص سعر", en: "Lowest price" },
  "home.best": { ar: "الأفضل", en: "Best" },
  "home.exploreTitle": { ar: "استكشف HkeeemAI", en: "Explore HkeeemAI" },
  "home.exploreSubtitle": {
    ar: "كل أقسام المنصة في مكان واحد",
    en: "Every section of the platform in one place",
  },
  "home.partnersTitle": { ar: "المتاجر المشاركة", en: "Participating stores" },
  "home.allStores": { ar: "كل المتاجر", en: "All stores" },
  "home.currency": { ar: "ر.س", en: "SAR" },

  // Pillars
  "pillar.deals": { ar: "أفضل العروض", en: "Top deals" },
  "pillar.dealsNote": { ar: "مرتّبة بالذكاء الاصطناعي", en: "Ranked by AI" },
  "pillar.compareNote": { ar: "نفس المنتج، أرخص متجر", en: "Same product, cheapest store" },
  "pillar.couponsNote": { ar: "أحدث الأكواد الفعّالة", en: "Latest working codes" },
  "pillar.storesNote": { ar: "+65 متجرًا موثّقًا", en: "65+ verified stores" },
  "pillar.realEstate": { ar: "العقارات", en: "Real estate" },
  "pillar.realEstateNote": { ar: "بحث عقاري ذكي", en: "Smart property search" },
  "pillar.cars": { ar: "السيارات", en: "Cars" },
  "pillar.carsNote": { ar: "مقارنة وكالات — قريباً", en: "Dealer comparison — soon" },
  "pillar.maps": { ar: "الخرائط", en: "Maps" },
  "pillar.mapsNote": { ar: "أقرب العروض حولك", en: "Deals near you" },
  "pillar.assistant": { ar: "مساعد حكيم AI", en: "HkeeemAI assistant" },
  "pillar.assistantNote": { ar: "اسأله بالعربي", en: "Ask in Arabic or English" },

  // Footer
  "footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy policy" },
  "footer.terms": { ar: "الشروط والأحكام", en: "Terms of use" },
  "footer.contact": { ar: "التواصل", en: "Contact" },
  "footer.email": { ar: "البريد", en: "Email" },
  "footer.account": { ar: "حسابي", en: "My account" },
  "footer.deleteAccount": { ar: "حذف الحساب", en: "Delete account" },

  // Common
  "common.language": { ar: "اللغة", en: "Language" },
  "common.switchToEnglish": { ar: "التبديل إلى الإنجليزية", en: "Switch to Arabic" },
  "common.skipToContent": { ar: "تخطي إلى المحتوى الرئيسي", en: "Skip to main content" },
  "common.retry": { ar: "إعادة المحاولة", en: "Try again" },
  "common.errorTitle": { ar: "صار خطأ غير متوقع", en: "Something went wrong" },
  "common.errorHint": { ar: "جرّب تحدّث الصفحة.", en: "Try refreshing the page." },
  "common.loading": { ar: "جارِ التحميل…", en: "Loading…" },
  "common.back": { ar: "رجوع", en: "Back" },

  // Build / preview errors page
  "item.buildErrors": { ar: "سجل الأخطاء", en: "Error log" },
  "errors.title": { ar: "سجل أخطاء المعاينة", en: "Preview error log" },
  "errors.subtitle": {
    ar: "آخر أخطاء البناء والتشغيل مع وقتها والرسالة التي ظهرت للمستخدم",
    en: "Latest build and runtime errors with their time and the message shown to the user",
  },
  "errors.refresh": { ar: "تحديث", en: "Refresh" },
  "errors.clear": { ar: "مسح السجل", en: "Clear log" },
  "errors.empty": { ar: "لا توجد أخطاء مسجّلة", en: "No errors recorded" },
  "errors.emptyHint": {
    ar: "أي خطأ يظهر أثناء المعاينة سيُسجَّل هنا تلقائياً.",
    en: "Any error shown during preview is recorded here automatically.",
  },
  "errors.details": { ar: "تفاصيل تقنية", en: "Technical details" },

  // Stores page
  "stores.title": { ar: "المتاجر", en: "Stores" },
  "stores.count": { ar: "متجرًا شريكًا", en: "partner stores" },

  // Notifications page
  "notif.title": { ar: "إعدادات الإشعارات", en: "Notification settings" },
  "notif.subtitle": {
    ar: "تحكّم في تنبيهات العروض وانخفاض الأسعار",
    en: "Control deal alerts and price-drop notifications",
  },
  "notif.enable": { ar: "تفعيل الإشعارات", en: "Enable notifications" },
  "notif.test": { ar: "إشعار تجريبي", en: "Send a test notification" },
  "notif.reprompt": { ar: "إعادة طلب الإذن", en: "Ask for permission again" },

  // Maps page
  "maps.title": { ar: "خريطتي", en: "Hkeeem Map" },
  "maps.subtitle": {
    ar: "أقرب العروض والمتاجر حولك",
    en: "The closest deals and stores around you",
  },
} as const;

export type TKey = keyof typeof dict;

type Ctx = { lang: Lang; dir: "rtl" | "ltr"; setLang: (l: Lang) => void; t: (k: TKey) => string };

const LanguageContext = createContext<Ctx>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  t: (k) => dict[k]?.ar ?? (k as string),
});

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  // العربية هي اللغة الافتراضية للمنصة؛ لا نغيّرها تلقائيًا حسب لغة الجهاز.
  return "ar";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR يبدأ دائماً بالعربية لتفادي اختلاف الترطيب، ثم نكتشف لغة المتصفح بعد التحميل
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dir;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t: (k: TKey) => (dict[k]?.[lang] ?? dict[k]?.ar ?? (k as string)) as string,
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
