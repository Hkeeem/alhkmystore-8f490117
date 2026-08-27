/**
 * دليل المتاجر الإلكترونية الرسمية.
 * لا يحتوي على أي عروض أو أكواد خصم — فقط اسم المتجر والفئة والرابط الرسمي.
 */
export type DirectoryStore = {
  id: string;
  name: string;
  category: string;
  region: "السعودية" | "الخليج" | "عالمي";
  url: string;
};

export const STORES_DIRECTORY: DirectoryStore[] = [
  // تسوق عام
  { id: "noon", name: "نون", category: "تسوق عام", region: "السعودية", url: "https://www.noon.com/saudi-ar/" },
  { id: "amazon-sa", name: "أمازون السعودية", category: "تسوق عام", region: "السعودية", url: "https://www.amazon.sa/" },
  { id: "amazon", name: "أمازون", category: "تسوق عام", region: "عالمي", url: "https://www.amazon.com/" },
  { id: "aliexpress", name: "علي إكسبرس", category: "تسوق عام", region: "عالمي", url: "https://www.aliexpress.com/" },
  { id: "alibaba", name: "علي بابا", category: "جملة", region: "عالمي", url: "https://www.alibaba.com/" },
  { id: "temu", name: "تيمو", category: "تسوق عام", region: "عالمي", url: "https://www.temu.com/" },
  { id: "ubuy", name: "يو باي السعودية", category: "تسوق عام", region: "الخليج", url: "https://www.ubuy.com.sa/ar/" },
  { id: "ebay", name: "إي باي", category: "تسوق عام", region: "عالمي", url: "https://www.ebay.com/" },
  { id: "salla", name: "متاجر سلة", category: "تسوق عام", region: "السعودية", url: "https://salla.sa/" },
  { id: "zid", name: "متاجر زد", category: "تسوق عام", region: "السعودية", url: "https://zid.sa/" },

  // إلكترونيات
  { id: "extra", name: "إكسترا", category: "إلكترونيات", region: "السعودية", url: "https://www.extra.com/" },
  { id: "jarir", name: "جرير", category: "إلكترونيات", region: "السعودية", url: "https://www.jarir.com/" },
  { id: "sharaf-dg", name: "شرف دي جي", category: "إلكترونيات", region: "الخليج", url: "https://uae.sharafdg.com/" },
  { id: "virgin", name: "فيرجن ميغاستور", category: "إلكترونيات", region: "الخليج", url: "https://www.virginmegastore.sa/" },
  { id: "apple-sa", name: "آبل السعودية", category: "إلكترونيات", region: "السعودية", url: "https://www.apple.com/sa-ar/" },
  { id: "samsung-sa", name: "سامسونج السعودية", category: "إلكترونيات", region: "السعودية", url: "https://www.samsung.com/sa_ar/" },
  { id: "xcite", name: "إكسايت", category: "إلكترونيات", region: "الخليج", url: "https://www.xcite.com/" },
  { id: "stc", name: "متجر stc", category: "اتصالات", region: "السعودية", url: "https://www.stc.com.sa/" },
  { id: "mobily", name: "موبايلي", category: "اتصالات", region: "السعودية", url: "https://www.mobily.com.sa/" },
  { id: "zain-sa", name: "زين السعودية", category: "اتصالات", region: "السعودية", url: "https://www.sa.zain.com/" },

  // أزياء
  { id: "shein", name: "شي إن", category: "أزياء", region: "عالمي", url: "https://www.shein.com/" },
  { id: "namshi", name: "نمشي", category: "أزياء", region: "الخليج", url: "https://www.namshi.com/" },
  { id: "styli", name: "ستايلي", category: "أزياء", region: "الخليج", url: "https://www.styli.com/" },
  { id: "trendyol", name: "ترينديول", category: "أزياء", region: "عالمي", url: "https://www.trendyol.com/" },
  { id: "centrepoint", name: "سنتربوينت", category: "أزياء", region: "الخليج", url: "https://www.centrepointstores.com/" },
  { id: "max", name: "ماكس فاشن", category: "أزياء", region: "الخليج", url: "https://www.maxfashion.com/sa/ar/" },
  { id: "hm-sa", name: "إتش آند إم السعودية", category: "أزياء", region: "السعودية", url: "https://www2.hm.com/ar_sa/index.html" },
  { id: "asos", name: "ASOS", category: "أزياء", region: "عالمي", url: "https://www.asos.com/" },
  { id: "ounass", name: "أُناس", category: "أزياء فاخرة", region: "الخليج", url: "https://www.ounass.sa/" },
  { id: "farfetch", name: "فارفيتش", category: "أزياء فاخرة", region: "عالمي", url: "https://www.farfetch.com/sa/" },
  { id: "sivvi", name: "سيفي", category: "أزياء", region: "الخليج", url: "https://www.sivvi.com/" },
  { id: "6thstreet", name: "6thStreet", category: "أزياء", region: "الخليج", url: "https://en-sa.6thstreet.com/" },
  { id: "mamas-papas", name: "ماماز آند باباز", category: "الأطفال", region: "الخليج", url: "https://www.mamasandpapas.com.sa/" },
  { id: "babyshop", name: "بيبي شوب", category: "الأطفال", region: "الخليج", url: "https://www.babyshopstores.com/sa/ar/" },

  // بقالة وتموين
  { id: "panda", name: "بنده", category: "بقالة", region: "السعودية", url: "https://www.panda.com.sa/" },
  { id: "othaim", name: "أسواق العثيم", category: "بقالة", region: "السعودية", url: "https://www.othaimmarkets.com/" },
  { id: "lulu", name: "لولو هايبرماركت", category: "بقالة", region: "السعودية", url: "https://www.luluhypermarket.com/ar-sa/" },
  { id: "carrefour-sa", name: "كارفور السعودية", category: "بقالة", region: "السعودية", url: "https://www.carrefourksa.com/mafsau/ar/" },
  { id: "tamimi", name: "أسواق التميمي", category: "بقالة", region: "السعودية", url: "https://shop.tamimimarkets.com/" },
  { id: "danube", name: "الدانوب", category: "بقالة", region: "السعودية", url: "https://danube.sa/" },
  { id: "nana", name: "نعناع", category: "بقالة", region: "السعودية", url: "https://nana.sa/" },
  { id: "farm", name: "أسواق المزرعة", category: "بقالة", region: "السعودية", url: "https://alfarmsuperstores.com/" },

  // مطاعم وتوصيل
  { id: "jahez", name: "جاهز", category: "مطاعم", region: "السعودية", url: "https://www.jahez.net/" },
  { id: "hungerstation", name: "هنقرستيشن", category: "مطاعم", region: "السعودية", url: "https://hungerstation.com/" },
  { id: "toyou", name: "تويو", category: "مطاعم", region: "السعودية", url: "https://www.toyou.io/" },
  { id: "the-chefz", name: "ذا شيفز", category: "مطاعم", region: "السعودية", url: "https://www.thechefz.co/" },
  { id: "ninja", name: "نينجا", category: "مطاعم", region: "السعودية", url: "https://ninja.sa/" },
  { id: "marsool", name: "مرسول", category: "مطاعم", region: "السعودية", url: "https://mrsool.co/" },

  // صحة وتجميل
  { id: "iherb", name: "آي هيرب", category: "صحة", region: "عالمي", url: "https://www.iherb.com/" },
  { id: "nahdi", name: "النهدي", category: "صيدلية", region: "السعودية", url: "https://www.nahdionline.com/" },
  { id: "dawaa", name: "الدواء", category: "صيدلية", region: "السعودية", url: "https://www.al-dawaa.com/" },
  { id: "nice-one", name: "نايس ون", category: "تجميل", region: "السعودية", url: "https://niceonesa.com/" },
  { id: "sephora-sa", name: "سيفورا السعودية", category: "تجميل", region: "السعودية", url: "https://www.sephora.sa/" },
  { id: "boutiqaat", name: "بوتيكات", category: "تجميل", region: "الخليج", url: "https://www.boutiqaat.com/" },
  { id: "golden-scent", name: "قولدن سنت", category: "عطور", region: "السعودية", url: "https://ar.goldenscent.com/" },
  { id: "arabian-oud", name: "العربية للعود", category: "عطور", region: "السعودية", url: "https://www.arabianoud.com/" },

  // المنزل والأثاث
  { id: "almanea", name: "المنيع", category: "أثاث", region: "السعودية", url: "https://www.almanea.sa/" },
  { id: "ikea-sa", name: "إيكيا السعودية", category: "أثاث", region: "السعودية", url: "https://www.ikea.com/sa/ar/" },
  { id: "home-centre", name: "هوم سنتر", category: "أثاث", region: "الخليج", url: "https://www.homecentre.com/sa/ar/" },
  { id: "saco", name: "ساكو", category: "المنزل", region: "السعودية", url: "https://www.saco.sa/" },
  { id: "homeworks", name: "هوم ووركس", category: "المنزل", region: "السعودية", url: "https://homeworks.com.sa/" },

  // هدايا وترفيه وسفر
  { id: "floward", name: "فلاورد", category: "هدايا", region: "الخليج", url: "https://www.floward.com/" },
  { id: "flowerna", name: "فلورنا", category: "هدايا", region: "السعودية", url: "https://flowerna.sa/" },
  { id: "almosafer", name: "المسافر", category: "سفر", region: "السعودية", url: "https://www.almosafer.com/ar" },
  { id: "webook", name: "webook", category: "ترفيه", region: "السعودية", url: "https://webook.com/ar" },
];

export const DIRECTORY_CATEGORIES = Array.from(new Set(STORES_DIRECTORY.map((s) => s.category)));
