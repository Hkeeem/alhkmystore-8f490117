import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ─────────────────────────────────────────────────────────
   1) الأنواع
   ───────────────────────────────────────────────────────── */
export type Lang = "ar" | "en";
export type Dir = "rtl" | "ltr";
export type DictEntry = { ar: string; en: string };

const STORAGE_KEY = "hk-lang";

/* ─────────────────────────────────────────────────────────
   2) قاموس الواجهة
   ───────────────────────────────────────────────────────── */
export const dict = {
  /* ── Navigation ─────────────────────────────────────── */
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

  /* ── Sidebar groups ─────────────────────────────────── */
  "sidebar.group.shopping": { ar: "التسوق", en: "Shopping" },
  "sidebar.group.tools": { ar: "الأدوات", en: "Tools" },
  "sidebar.group.account": { ar: "الحساب", en: "Account" },

  /* ── Item labels (generic) ──────────────────────────── */
  "item.coupons": { ar: "كوبونات", en: "Coupons" },
  "item.stores": { ar: "المتاجر", en: "Stores" },
  "item.deals": { ar: "العروض", en: "Deals" },
  "item.products": { ar: "المنتجات", en: "Products" },
  "item.categories": { ar: "التصنيفات", en: "Categories" },

  /* ── Common actions ─────────────────────────────────── */
  "common.viewAll": { ar: "عرض الكل", en: "View all" },
  "common.more": { ar: "المزيد", en: "More" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.copy": { ar: "نسخ", en: "Copy" },
  "common.copied": { ar: "تم النسخ", en: "Copied" },
  "common.loading": { ar: "جارٍ التحميل…", en: "Loading…" },
  "common.retry": { ar: "إعادة المحاولة", en: "Retry" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.currency": { ar: "ر.س", en: "SAR" },
  "common.empty": { ar: "لا توجد بيانات", en: "No data available" },
  "common.error": { ar: "حدث خطأ ما", en: "Something went wrong" },

  /* ── Pillars (grid on home) ─────────────────────────── */
  "pillar.deals": { ar: "عروض حكيم", en: "Hakeem Deals" },
  "pillar.dealsNote": { ar: "أقوى الخصومات اليومية", en: "Top daily discounts" },
  "pillar.compareNote": {
    ar: "قارن الأسعار بين المتاجر",
    en: "Compare prices across stores",
  },
  "pillar.couponsNote": {
    ar: "أكواد خصم فعّالة ومجرَّبة",
    en: "Verified active coupon codes",
  },
  "pillar.storesNote": {
    ar: "أكثر من 65 متجرًا سعوديًا",
    en: "Over 65 Saudi stores",
  },
  "pillar.realEstate": { ar: "عقارات", en: "Real Estate" },
  "pillar.realEstateNote": { ar: "بيع وشراء وإيجار", en: "Buy, sell & rent" },
  "pillar.maps": { ar: "الخريطة", en: "Map" },
  "pillar.mapsNote": { ar: "أقرب المتاجر إليك", en: "Nearest stores to you" },
  "pillar.assistant": { ar: "مساعد حكيم AI", en: "Hakeem AI Assistant" },
  "pillar.assistantNote": {
    ar: "اسأل عن أي منتج أو عرض",
    en: "Ask about any product or deal",
  },

  /* ── Home page ──────────────────────────────────────── */
  "home.badge": {
    ar: "منصة سعودية بالذكاء الاصطناعي",
    en: "Saudi AI-powered platform",
  },
  "home.title1": { ar: "حكيم", en: "Hakeem" },
  "home.title2": {
    ar: "أذكى مساعد اقتصادي لك",
    en: "Your smartest deal hunter",
  },
  "home.subtitle": {
    ar: "قارن، اكتشف، ووفّر — كل العروض والكوبونات والمقارنات في منصة واحدة.",
    en: "Compare, discover, and save — all deals, coupons, and comparisons in one place.",
  },
  "home.searchPlaceholder": {
    ar: "ابحث عن منتج، متجر، أو عرض…",
    en: "Search a product, store, or deal…",
  },
  "home.searchLabel": { ar: "البحث الذكي", en: "Smart search" },
  "home.search": { ar: "ابحث", en: "Search" },
  "home.currency": { ar: "ر.س", en: "SAR" },
  "home.statStores": { ar: "متجر", en: "Stores" },
  "home.statSaving": { ar: "نسبة التوفير", en: "Average saving" },
  "home.statAssistant": { ar: "مساعد", en: "Assistant" },

  /* ── Live data (from Supabase) ──────────────────────── */
  "home.livePricesTitle": {
    ar: "الأسعار المحدثة من قاعدة البيانات (شاملة ضريبة 15%)",
    en: "Live prices from database (VAT 15% included)",
  },
  "home.activeCouponsTitle": {
    ar: "كوبونات الخصم النشطة",
    en: "Active discount coupons",
  },
  "home.couponCode": { ar: "رمز الكوبون", en: "Coupon code" },
  "home.discount": { ar: "خصم", en: "Discount" },
  "home.defaultStore": { ar: "متجر حكيم", en: "Hakeem Store" },
  "home.product": { ar: "منتج", en: "Product" },
  "home.beforeTax": { ar: "قبل الضريبة", en: "Before VAT" },

  /* ── Best deals & compare ───────────────────────────── */
  "home.bestTitle": { ar: "أفضل العروض", en: "Best deals" },
  "home.bestSubtitle": {
    ar: "مرتبة بالذكاء الاصطناعي حسب نسبة التوفير",
    en: "AI-ranked by savings percentage",
  },
  "home.compareTitle": { ar: "مقارنة الأسعار", en: "Price comparison" },
  "home.compareSubtitle": {
    ar: "نفس المنتج بين عدة متاجر",
    en: "Same product across multiple stores",
  },
  "home.cheapest": { ar: "الأرخص", en: "Cheapest" },
  "home.best": { ar: "الأفضل", en: "Best" },

  /* ── Explore & partners ─────────────────────────────── */
  "home.exploreTitle": { ar: "استكشف", en: "Explore" },
  "home.exploreSubtitle": {
    ar: "كل ما تحتاجه في مكان واحد",
    en: "Everything you need in one place",
  },
  "home.partnersTitle": { ar: "شركاؤنا", en: "Our partners" },
  "home.allStores": { ar: "كل المتاجر", en: "All stores" },

  /* ── AI Tools section ───────────────────────────────── */
  "home.aiToolsTitle": {
    ar: "قدرات الذكاء الاقتصادي",
    en: "Economic intelligence",
  },
  "home.aiToolsSubtitle": {
    ar: "أدوات ذكية تخدم قرارك الشرائي",
    en: "Smart tools for smarter buying",
  },

  "home.ai.compareTag": { ar: "محدث لحظياً", en: "Real-time" },
  "home.ai.compareTitle": {
    ar: "محرك مقارنة الأسعار والعروض",
    en: "Price & deal comparison engine",
  },
  "home.ai.compareDesc": {
    ar: "قارن سعر نفس المنتج بين نون وأمازون وجرير وإكسترا ومتجر حكيم — وادفع أقل سعر ممكن.",
    en: "Compare the same product across Noon, Amazon, Jarir, Extra, and Hakeem Store — pay the lowest price.",
  },
  "home.ai.compareCta": { ar: "قارن الآن", en: "Compare now" },

  "home.ai.analysisTag": { ar: "تحليل عميق", en: "Deep analysis" },
  "home.ai.analysisTitle": {
    ar: "تحليل المتاجر والمنافسين بالذكاء الاصطناعي",
    en: "AI store & competitor analysis",
  },
  "home.ai.analysisDesc": {
    ar: "تحليل SWOT متكامل: تموضع الأسعار، نقاط القوة والضعف، حساب هامش الربح، واستراتيجيات النمو وتخفيض تكلفة الشحن.",
    en: "Full SWOT: pricing positioning, strengths, weaknesses, margin calc, growth strategies, and shipping cost optimization.",
  },
  "home.ai.analysisCta": { ar: "ابدأ التحليل", en: "Start analysis" },

  "home.ai.adsTag": { ar: "توليد فوري", en: "Instant generation" },
  "home.ai.adsTitle": {
    ar: "مولد محتوى الإعلانات والوصف التسويقي",
    en: "Ads & marketing copy generator",
  },
  "home.ai.adsDesc": {
    ar: "نصوص إعلانية بلهجة سعودية لسناب شات وتيك توك وإنستغرام، مع تحسين الكلمات المفتاحية SEO.",
    en: "Saudi-dialect ad copy for Snapchat, TikTok, and Instagram, with SEO keyword optimization.",
  },
  "home.ai.adsCta": { ar: "ولّد إعلانك", en: "Generate your ad" },

  "home.ai.marketTag": { ar: "عقارات وتجارة", en: "Real estate & trade" },
  "home.ai.marketTitle": {
    ar: "سوق حكيم التجاري والعقاري الموحد",
    en: "Hakeem unified trade & real-estate market",
  },
  "home.ai.marketDesc": {
    ar: "منتجات وعقارات في الرياض وجدة والخبر مع حاسبة العائد الإيجاري، مدى و STC Pay، وشحن سبل وسمسا خلال 24-48 ساعة.",
    en: "Products and properties in Riyadh, Jeddah, and Khobar with rental yield calculator, Mada & STC Pay, and Sabil/SMSA shipping in 24–48h.",
  },
  "home.ai.marketCta": {
    ar: "تصفح السوق والحاسبة",
    en: "Browse market & calculator",
  },

  /* ── Feature cards ──────────────────────────────────── */
  "home.feature.trustTitle": { ar: "بيانات موثوقة", en: "Trusted data" },
  "home.feature.trustDesc": {
    ar: "أسعار محدّثة من مصادر رسمية",
    en: "Prices updated from official sources",
  },
  "home.feature.luxuryTitle": { ar: "تجربة فاخرة", en: "Premium experience" },
  "home.feature.luxuryDesc": {
    ar: "تصميم بمعايير أفضل التطبيقات",
    en: "Design at the standard of top apps",
  },
  "home.feature.assistantTitle": {
    ar: "مساعد حكيم AI",
    en: "Hakeem AI assistant",
  },
  "home.feature.assistantDesc": {
    ar: "قرارات اقتصادية أسرع وأذكى",
    en: "Faster, smarter economic decisions",
  },

  /* ── Deals page ─────────────────────────────────────── */
  "deals.title": { ar: "كل العروض", en: "All deals" },
  "deals.subtitle": {
    ar: "أحدث وأقوى الخصومات اليومية",
    en: "Latest and strongest daily discounts",
  },
  "deals.filter.all": { ar: "الكل", en: "All" },
  "deals.filter.store": { ar: "حسب المتجر", en: "By store" },
  "deals.filter.category": { ar: "حسب التصنيف", en: "By category" },
  "deals.filter.discount": { ar: "حسب الخصم", en: "By discount" },

  /* ── Coupons page ───────────────────────────────────── */
  "coupons.title": { ar: "الكوبونات", en: "Coupons" },
  "coupons.subtitle": {
    ar: "أكواد خصم فعّالة ومحدّثة يوميًا",
    en: "Active coupons updated daily",
  },
  "coupons.copyCode": { ar: "انسخ الكود", en: "Copy code" },
  "coupons.expires": { ar: "ينتهي", en: "Expires" },
  "coupons.used": { ar: "مستخدم", en: "Used" },
  "coupons.active": { ar: "نشط", en: "Active" },

  /* ── Stores page ────────────────────────────────────── */
  "stores.title": { ar: "المتاجر", en: "Stores" },
  "stores.subtitle": {
    ar: "أكثر من 65 متجرًا سعوديًا",
    en: "Over 65 Saudi stores",
  },

  /* ── Chat / Assistant ───────────────────────────────── */
  "chat.title": { ar: "مساعد حكيم", en: "Hakeem Assistant" },
  "chat.placeholder": {
    ar: "اسأل عن أي منتج أو عرض…",
    en: "Ask about any product or deal…",
  },
  "chat.send": { ar: "إرسال", en: "Send" },
  "chat.thinking": { ar: "يفكّر…", en: "Thinking…" },

  /* ── Footer ─────────────────────────────────────────── */
  "footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  "footer.about": { ar: "عن حكيم", en: "About Hakeem" },
  "footer.contact": { ar: "تواصل معنا", en: "Contact us" },
  "footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "footer.terms": { ar: "الشروط والأحكام", en: "Terms & Conditions" },
} as const satisfies Record<string, DictEntry>;

export type DictKey = keyof typeof dict;

/* ─────────────────────────────────────────────────────────
   3) الـ Context
   ───────────────────────────────────────────────────────── */
export type I18nContextValue = {
  lang: Lang;
  dir: Dir;
  t: (key: DictKey) => string;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/* ─────────────────────────────────────────────────────────
   4) Provider
   ───────────────────────────────────────────────────────── */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "ar" ? stored : "ar";
  });

  const dir: Dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => (prev === next ? prev : next));
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const t = useCallback(
    (key: DictKey) => {
      const entry = dict[key];
      if (!entry) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] Missing key: ${String(key)}`);
        }
        return String(key);
      }
      return entry[lang];
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir, t, setLang, toggleLang }),
    [lang, dir, t, setLang, toggleLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/* ─────────────────────────────────────────────────────────
   5) Hook
   ───────────────────────────────────────────────────────── */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider> / <LanguageProvider>");
  }
  return ctx;
}

/* ─────────────────────────────────────────────────────────
   6) Aliases للتوافق مع الكود القديم
   ───────────────────────────────────────────────────────── */
export const LanguageProvider = I18nProvider;
export type LanguageContextValue = I18nContextValue;
