import {
  Apple, Beef, Beer, Cookie, Coffee, Croissant, Droplet, Egg, Milk, Pizza,
  Sandwich, Utensils, Wheat, Salad, IceCream,
  Smartphone, Laptop, Headphones, Monitor, Tv, Camera, Gamepad2, Watch,
  Pill, Sparkles, HeartPulse, Stethoscope,
  ShoppingBasket, ShoppingBag, Store as StoreIcon, Building2, Truck,
  type LucideIcon,
} from "lucide-react";
import type { Category, Deal, Store } from "@/data/deals";

// Map product emoji → Lucide icon. Falls back by category.
const EMOJI_ICON: Record<string, LucideIcon> = {
  "🍚": Wheat, "🫒": Droplet, "🥛": Milk, "🍗": Beef, "🥚": Egg,
  "🧂": Salad, "☕": Coffee, "🍞": Croissant, "🍎": Apple, "🍦": IceCream,
  "🍕": Pizza, "🍔": Sandwich, "🌯": Utensils, "🍛": Utensils, "🍺": Beer, "🍪": Cookie,
  "📱": Smartphone, "💻": Laptop, "🎧": Headphones, "📺": Tv,
  "📷": Camera, "🎮": Gamepad2, "⌚": Watch, "🖥️": Monitor,
  "💊": Pill, "🧴": Sparkles, "🪥": Stethoscope, "❤️": HeartPulse,
};

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  "سوبرماركت": ShoppingBasket,
  "مطاعم": Utensils,
  "إلكترونيات": Smartphone,
  "أزياء": ShoppingBag,
  "صيدلية": Pill,
};

const STORE_ICON: Record<string, LucideIcon> = {
  jarir: Laptop, extra: Tv, noon: ShoppingBag, amazon: ShoppingBag,
  hunger: Utensils, jahez: Utensils, toshel: Truck,
  nahdi: Pill, dawaa: Pill,
  othaim: ShoppingBasket, panda: ShoppingBasket, lulu: ShoppingBasket,
  danube: ShoppingBasket, tamimi: ShoppingBasket,
};

export function getDealIcon(deal: Deal): LucideIcon {
  return EMOJI_ICON[deal.image] ?? CATEGORY_ICON[deal.category] ?? StoreIcon;
}

export function getStoreIcon(store: Store): LucideIcon {
  return STORE_ICON[store.id] ?? CATEGORY_ICON[store.category] ?? Building2;
}

export function getCategoryIcon(cat: Category): LucideIcon {
  return CATEGORY_ICON[cat] ?? StoreIcon;
}
