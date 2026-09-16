import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hkeeem-battery-saver';

/**
 * وضع توفير البطارية — Dark Mode متطور:
 * - خلفية سوداء تماماً (#000) على شاشات OLED = البكسلات مطفية = توفير حقيقي
 * - تقليل الصور والحركات والتحديثات
 * - اكتشاف تلقائي لو البطارية ضعيفة
 */
export function useBatterySaver() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  // طبّق الـ class على <html>
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('battery-saver');
      root.setAttribute('data-theme', 'battery-saver');
    } else {
      root.classList.remove('battery-saver');
      root.removeAttribute('data-theme');
    }
  }, [enabled]);

  // اكتشاف تلقائي لو البطارية ضعيفة (Chrome only)
  useEffect(() => {
    if (!('getBattery' in navigator)) return;
    (navigator as any).getBattery?.().then((battery: any) => {
      const check = () => {
        if (battery.level <= 0.15 && !battery.charging && !enabled) {
          setEnabled(true);
          localStorage.setItem(STORAGE_KEY, '1');
        }
      };
      check();
      battery.addEventListener('levelchange', check);
      battery.addEventListener('chargingchange', check);
    });
  }, [enabled]);

  return { enabled, toggle };
}
