import { Monitor } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme, auto, setAuto, systemDark, themes } = useTheme();

  return (
    <div
      className={`flex items-center gap-1 rounded-2xl border border-primary/25 bg-secondary/50 p-1 ${className}`}
      role="group"
      aria-label="نمط الألوان"
    >
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          aria-label={t.label}
          title={t.label}
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
