import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const next = lang === "ar" ? "en" : "ar";
  const label = lang === "ar" ? "English" : "العربية";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      title={label}
      className={
        "inline-flex items-center gap-1.5 rounded-xl bg-secondary/60 hover:bg-secondary px-2.5 py-2 text-xs font-bold text-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        className
      }
    >
      <Languages className="w-4 h-4 text-primary" />
      <span className="leading-none">{lang === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
