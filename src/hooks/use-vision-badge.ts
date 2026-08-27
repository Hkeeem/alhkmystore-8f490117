import { useEffect, useState } from "react";

export type BadgePosition = "start" | "center" | "end";
export type BadgeSize = "sm" | "md" | "lg";

export interface VisionBadgeSettings {
  /** إظهار/إخفاء خلفية 2030 */
  visible: boolean;
  /** مستوى الشفافية 0–100 */
  opacity: number;
  /** المكان داخل الترويسة */
  position: BadgePosition;
  /** حجم الرقم */
  size: BadgeSize;
}

export const DEFAULT_BADGE: VisionBadgeSettings = {
  visible: true,
  opacity: 16,
  position: "center",
  size: "md",
};

export const BADGE_POSITIONS: { id: BadgePosition; label: string }[] = [
  { id: "start", label: "بداية الشعار" },
  { id: "center", label: "وسط الشعار" },
  { id: "end", label: "نهاية الشعار" },
];

export const BADGE_SIZES: { id: BadgeSize; label: string }[] = [
  { id: "sm", label: "صغير" },
  { id: "md", label: "متوسط" },
  { id: "lg", label: "كبير" },
];

const KEY = "hkeeem-vision-badge";
const EVT = "hkeeem:vision-badge";

function read(): VisionBadgeSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BADGE;
    const parsed = JSON.parse(raw) as Partial<VisionBadgeSettings>;
    return {
      visible: typeof parsed.visible === "boolean" ? parsed.visible : DEFAULT_BADGE.visible,
      opacity:
        typeof parsed.opacity === "number" ? Math.min(100, Math.max(0, parsed.opacity)) : DEFAULT_BADGE.opacity,
      position: BADGE_POSITIONS.some((p) => p.id === parsed.position)
        ? (parsed.position as BadgePosition)
        : DEFAULT_BADGE.position,
      size: BADGE_SIZES.some((s) => s.id === parsed.size) ? (parsed.size as BadgeSize) : DEFAULT_BADGE.size,
    };
  } catch {
    return DEFAULT_BADGE;
  }
}

export function useVisionBadge() {
  // نبدأ بالقيم الافتراضية على الخادم والعميل لتفادي اختلاف الترطيب
  const [settings, setSettings] = useState<VisionBadgeSettings>(DEFAULT_BADGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(read());
    setReady(true);
    const sync = () => setSettings(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (patch: Partial<VisionBadgeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(EVT));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const reset = () => update(DEFAULT_BADGE);

  return { settings, update, reset, ready };
}
