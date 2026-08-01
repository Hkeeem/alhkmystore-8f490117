import { Monitor, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTheme, type Theme } from "@/hooks/use-theme";

const CLASSES = ["theme-gold", "theme-silver", "theme-bronze"];

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme, auto, setAuto, systemDark, themes } = useTheme();
  const [previewing, setPreviewing] = useState<Theme | null>(null);

  const apply = (t: Theme) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.classList.remove(...CLASSES);
    root.classList.add(`theme-${t}`);
  };

  /** الضغط يحفظ الثيم فورًا (بدون أي خطوة إضافية) */
  const commit = (t: Theme, label: string) => {
    apply(t);
    setTheme(t);
    setPreviewing(null);
    toast.success(`تم حفظ ${label}`);
  };

  /** معاينة فورية عند المرور/التركيز قبل الحفظ */
  const preview = (t: Theme) => {
    apply(t);
    setPreviewing(t);
  };

  /** الرجوع للثيم المحفوظ — فقط عند مغادرة المبدّل بالكامل */
  const restore = () => {
    apply(theme);
    setPreviewing(null);
  };

  /** لا نرجع إلا إذا خرج التركيز خارج مجموعة الأزرار */
  const onGroupBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    restore();
  };

  const pending = previewing && (auto || previewing !== theme) ? previewing : null;
  const pendingLabel = themes.find((t) => t.id === pending)?.label ?? "";

  return (
    <div
      className={`flex items-center gap-1 rounded-2xl border border-primary/25 bg-secondary/50 p-1 ${className}`}
      role="group"
      aria-label="نمط الألوان"
      onMouseLeave={restore}
      onBlur={onGroupBlur}
    >

      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => commit(t.id, t.label)}
          onMouseEnter={() => preview(t.id)}
          onFocus={() => preview(t.id)}

          aria-label={t.label}
          title={`${t.label} — معاينة فورية`}
          aria-pressed={!auto && theme === t.id}
          className={`w-6 h-6 rounded-full transition ring-offset-1 ring-offset-background ${
            !auto && theme === t.id
              ? "ring-2 ring-primary scale-105"
              : "ring-1 ring-border opacity-70 hover:opacity-100"
          }`}
          style={{ backgroundImage: t.swatch }}
        />
      ))}

      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />

      <button
        onClick={() => setAuto(!auto)}
        aria-label="اتباع إعدادات النظام"
        title={
          auto
            ? `تلقائي (النظام: ${systemDark ? "داكن" : "فاتح"}) — اضغط للعودة لآخر ثيم محدد`
            : "تلقائي حسب النظام"
        }
        aria-pressed={auto}
        className={`w-6 h-6 rounded-full grid place-items-center transition ring-offset-1 ring-offset-background ${
          auto
            ? "ring-2 ring-primary scale-105 bg-primary/15 text-primary"
            : "ring-1 ring-border opacity-70 hover:opacity-100 text-muted-foreground"
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
