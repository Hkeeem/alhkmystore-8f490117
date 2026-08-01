import { useTheme } from "@/hooks/use-theme";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, setTheme, themes } = useTheme();

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
          aria-pressed={theme === t.id}
          className={`w-6 h-6 rounded-full transition ring-offset-1 ring-offset-background ${
            theme === t.id ? "ring-2 ring-primary scale-105" : "ring-1 ring-border opacity-70 hover:opacity-100"
          }`}
          style={{ backgroundImage: t.swatch }}
        />
      ))}
    </div>
  );
}
