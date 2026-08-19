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
  { id: "noon", name: "نون", category: "تسوق عام", region: "السعودية", url: "https://www.noon.com/saudi-ar/" },
  { id: "amazon-sa", name: "أمازون السعودية", category: "تسوق عام", region: "السعودية", url: "https://www.amazon.sa/" },
  { id: "amazon", name: "أمازون", category: "تسوق عام", region: "عالمي", url: "https://www.amazon.com/" },
  { id: "extra", name: "إكسترا", category: "إلكترونيات", region: "السعودية", url: "https://www.extra.com/" },
  { id: "jarir", name: "جرير", category: "إلكترونيات", region: "السعودية", url: "https://www.jarir.com/" },
  { id: "shein", name: "شي إن", category: "أزياء", region: "عالمي", url: "https://www.shein.com/" },
  { id: "namshi", name: "نمشي", category: "أزياء", region: "الخليج", url: "https://www.namshi.com/" },
  { id: "styli", name: "ستايلي", category: "أزياء", region: "الخليج", url: "https://www.styli.com/" },
  { id: "trendyol", name: "ترينديول", category: "أزياء", region: "عالمي", url: "https://www.trendyol.com/" },
  { id: "centrepoint", name: "سنتربوينت", category: "أزياء", region: "الخليج", url: "https://www.centrepointstores.com/" },
  { id: "aliexpress", name: "علي إكسبرس", category: "تسوق عام", region: "عالمي", url: "https://www.aliexpress.com/" },
  { id: "alibaba", name: "علي بابا", category: "جملة", region: "عالمي", url: "https://www.alibaba.com/" },
  { id: "jahez", name: "جاهز", category: "مطاعم", region: "السعودية", url: "https://www.jahez.net/" },
  { id: "hungerstation", name: "هنقرستيشن", category: "مطاعم", region: "السعودية", url: "https://hungerstation.com/" },
  { id: "iherb", name: "آي هيرب", category: "صحة", region: "عالمي", url: "https://www.iherb.com/" },
  { id: "nice-one", name: "نايس ون", category: "تجميل", region: "السعودية", url: "https://niceonesa.com/" },
  { id: "almanea", name: "المنيع", category: "أثاث", region: "السعودية", url: "https://www.almanea.sa/" },
  { id: "nahdi", name: "النهدي", category: "صيدلية", region: "السعودية", url: "https://www.nahdionline.com/" },
];

export const DIRECTORY_CATEGORIES = Array.from(new Set(STORES_DIRECTORY.map((s) => s.category)));
