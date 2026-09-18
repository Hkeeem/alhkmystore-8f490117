import { useEffect, useState } from "react";

export type CardStyle = "elevated" | "flat" | "outline" | "glass";

export interface Appearance {
  /** لون التمييز (accent) بصيغة hex — فارغ = لون الثيم الافتراضي */
  accent: string;
  /** انحناء زوايا البطاقات بالبكسل */
  radius: number;
  /** شكل البطاقة */
  cardStyle: CardStyle;
}

export const ACCENT_PRESETS: { id: string; label: string; hex: string }[] = [
  { id: "default", label: "لون الثيم", hex: "" },
  { id: "gold", label: "ذهبي", hex: "#D4AF37" },
  { id: "amber", label: "عنبري", hex: "#F59E0B" },
  { id: "emerald", label: "زمردي", hex: "#059669" },
  { id: "royal", label: "أزرق ملكي", hex: "#2563EB" },
  { id: "violet", label: "بنفسجي", hex: "#5B21B6" },
  { id: "rose", label: "وردي", hex: "#E11D48" },
  { id: "graphite", label: "جرافيت", hex: "#475569" },
];

export const CARD_STYLES: { id: CardStyle; label: string; hint: string }[] = [
  { id: "elevated", label: "مرتفعة", hint: "ظل ناعم وإحساس بالعمق" },
  { id: "flat", label: "مسطّحة", hint: "بدون ظل — مظهر هادئ" },
  { id: "outline", label: "محدّدة", hint: "إطار واضح بلون التمييز" },
  { id: "glass", label: "زجاجية", hint: "شفافية وضبابية أنيقة" },
];

export const DEFAULT_APPEARANCE: Appearance = { accent: "#D4AF37", radius: 20, cardStyle: "elevated" };

const KEY = "hkeeem-appearance";
const EVT = "hkeeem:appearance";

function read(): Appearance {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    return {
      accent: typeof parsed.accent === "string" ? parsed.accent : DEFAULT_APPEARANCE.accent,
      radius:
        typeof parsed.radius === "number" && parsed.radius >= 0 && parsed.radius <= 32
          ? parsed.radius
          : DEFAULT_APPEARANCE.radius,
      cardStyle: CARD_STYLES.some((s) => s.id === parsed.cardStyle)
        ? (parsed.cardStyle as CardStyle)
        : DEFAULT_APPEARANCE.cardStyle,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

/** تطبيق الإعدادات على جذر الصفحة (متغيرات CSS + سمة data) */
export function applyAppearance(a: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--hk-card-radius", `${a.radius}px`);
  if (a.accent) root.style.setProperty("--primary", a.accent);
  else root.style.removeProperty("--primary");
  root.dataset["cardStyle"] = a.cardStyle;
}

/**
 * تخصيص مظهر البطاقات: لون التمييز، انحناء الزوايا، وشكل البطاقة.
 * تُحفظ محليًا وتُطبَّق فورًا على كامل التطبيق.
 */
export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = read();
    setAppearance(initial);
    applyAppearance(initial);
    setReady(true);

    const sync = () => {
      const next = read();
      setAppearance(next);
      applyAppearance(next);
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (patch: Partial<Appearance>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...patch };
      applyAppearance(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(EVT));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const reset = () => update(DEFAULT_APPEARANCE);

  /** معاينة مؤقتة بدون حفظ */
  const preview = (patch: Partial<Appearance>) => applyAppearance({ ...appearance, ...patch });
  const restore = () => applyAppearance(appearance);

  return { appearance, update, reset, preview, restore, ready };
}
