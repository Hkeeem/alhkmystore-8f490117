import type { LucideIcon } from "lucide-react";
import {
  ShoppingBasket, Wheat, Milk, Egg, Coffee, Beef, Fish, Apple, Cookie,
  Utensils, Pizza, Sandwich, IceCream,
  Smartphone, Laptop, Headphones, Tv, Monitor, Camera, Watch, Gamepad2,
  Shirt, Pill, Stethoscope, Store, ShoppingBag, ShoppingCart, Package,
} from "lucide-react";
import type { Deal, Store as StoreT } from "@/data/deals";

const KEY_ICONS: Array<{ match: RegExp; icon: LucideIcon }> = [
  [/أرز|بسمتي|basmati/i, Wheat],
  [/زيت|عافية/i, Utensils],
  [/حليب|لبن/i, Milk],
  [/دجاج|لحم|بيف/i, Beef],
  [/سمك|تونة/i, Fish],
  [/بيض/i, Egg],
  [/سكر|ملح|طحين|دقيق/i, Cookie],
  [/قهوة|شاي|كابتشينو|إسبريسو/i, Coffee],
  [/تفاح|فواكه|خضار|طماطم|موز/i, Apple],
  [/برجر|بيتزا|شاورما|وجبة|ساندوتش/i, Sandwich],
  [/آيس|آيسكريم|بوظة|حلا/i, IceCream],
  [/آيفون|iphone|جوال|سامسونج|هاتف/i, Smartphone],
  [/airpods|سماعة|هيدفون/i, Headphones],
  [/لابتوب|ماك|macbook|laptop/i, Laptop],
  [/تلفاز|tv|شاشة/i, Tv],
  [/شاشة|monitor/i, Monitor],
  [/كاميرا|camera/i, Camera],
  [/ساعة|watch/i, Watch],
  [/بلايستيشن|ps5|xbox|قيمنق|gaming/i, Gamepad2],
  [/قميص|ثوب|عباية|فستان|حذاء|أزياء/i, Shirt],
  [/فيتامين|دواء|علاج|بانادول|صيدلية|شامبو/i, Pill],
  [/طبي|كشف|فحص/i, Stethoscope],
  [/مطعم|طعام|مطاعم/i, Utensils],
  [/بيتزا/i, Pizza],
];

export function getDealIcon(deal: Pick<Deal, "title" | "category">): LucideIcon {
  for (const [rx, icon] of KEY_ICONS as unknown as Array<[RegExp, LucideIcon]>) {
    if (rx.test(deal.title)) return icon;
  }
  switch (deal.category) {
    case "سوبرماركت": return ShoppingBasket;
    case "مطاعم": return Utensils;
    case "إلكترونيات": return Smartphone;
    case "أزياء": return Shirt;
    case "صيدلية": return Pill;
    default: return Package;
  }
}

export function getStoreIcon(store: Pick<StoreT, "category">): LucideIcon {
  switch (store.category) {
    case "سوبرماركت": return ShoppingCart;
    case "مطاعم": return Utensils;
    case "إلكترونيات": return Smartphone;
    case "أزياء": return ShoppingBag;
    case "صيدلية": return Pill;
    default: return Store;
  }
}
