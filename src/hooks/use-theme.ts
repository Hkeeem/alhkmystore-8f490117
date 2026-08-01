import { useEffect, useState } from "react";

export type Theme = "gold" | "silver" | "bronze";

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "gold", label: "الوضع الذهبي", swatch: "linear-gradient(135deg,#F6DE7A,#D4AF37,#8A5A00)" },
  { id: "silver", label: "الوضع الفضي", swatch: "linear-gradient(135deg,#F4F6F8,#C0C6CC,#7C858E)" },
  { id: "bronze", label: "الوضع البرونزي", swatch: "linear-gradient(135deg,#E8B98A,#B87333,#6B3F1D)" },
];

const KEY = "hkeeem-theme";
const CLASSES = ["theme-gold", "theme-silver", "theme-bronze"];

export function useTheme() {
  // نبدأ دائمًا بالذهبي على الخادم والعميل لتفادي اختلاف الترطيب (hydration)
  const [theme, setThemeState] = useState<Theme>("gold");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const valid = THEMES.some((t) => t.id === stored) ? (stored as Theme) : "gold";
    setThemeState(valid);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.remove(...CLASSES, "dark");
    root.classList.add(`theme-${theme}`);
    localStorage.setItem(KEY, theme);
  }, [theme, ready]);

  const setTheme = (t: Theme) => setThemeState(t);
  const cycle = () =>
    setThemeState((t) => THEMES[(THEMES.findIndex((x) => x.id === t) + 1) % THEMES.length].id);

  return { theme, setTheme, cycle, themes: THEMES };
}
