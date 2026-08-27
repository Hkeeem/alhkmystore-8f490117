import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Sparkles, X } from "lucide-react";

export type FallbackSuggestion = {
  to: string;
  label: string;
  hint?: string;
  emoji?: string;
};

type Props = {
  icon?: string;
  title: string;
  message: string;
  suggestion?: FallbackSuggestion;
  backTo: { to: string; label: string };
  autoSeconds?: number;
};

/**
 * Shared in-app fallback for invalid/expired deep links.
 * Shows a friendly explanation, a "nearest available" suggestion,
 * and auto-navigates after a short countdown (cancelable).
 */
export function InvalidLinkFallback({
  icon = "🧭",
  title,
  message,
  suggestion,
  backTo,
  autoSeconds = 6,
}: Props) {
  const [remaining, setRemaining] = useState(autoSeconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || !suggestion) return;
    if (remaining <= 0) {
      if (typeof window !== "undefined") window.location.assign(suggestion.to);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused, suggestion]);

  const progress = Math.max(0, Math.min(100, ((autoSeconds - remaining) / autoSeconds) * 100));

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-6xl" aria-hidden>{icon}</div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> رابط غير صالح
          </div>
          <h1 className="font-display font-black text-2xl">{title}</h1>
          <p className="text-sm text-muted-foreground leading-7">{message}</p>
        </div>

        {suggestion && (

        )}

        <div className="flex items-center justify-center gap-2">
          {suggestion && (
            <a
              href={suggestion.to}
              className="inline-flex items-center gap-2 bg-gradient-hero text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm shadow-glow"
            >
              افتح الآن
            </a>
          )}
          <a
            href={backTo.to}
            className="inline-flex items-center gap-1.5 bg-secondary text-foreground px-5 py-2.5 rounded-2xl font-bold text-sm"
          >
            <ArrowRight className="w-4 h-4" /> {backTo.label}
          </a>
        </div>
      </div>
    </div>
  );
}
