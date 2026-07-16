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
  suggestion: FallbackSuggestion;
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
    if (paused) return;
    if (remaining <= 0) {
      if (typeof window !== "undefined") window.location.assign(suggestion.to);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused, suggestion.to]);

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

        <div className="rounded-3xl border border-border/60 bg-card p-5 text-right space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="w-4 h-4" /> اقتراح أقرب متاح
          </div>
          <Link
            to={suggestion.to}
            className="flex items-center gap-3 rounded-2xl bg-secondary/60 hover:bg-secondary p-3 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center text-2xl shadow-glow">
              {suggestion.emoji ?? "✨"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm truncate">{suggestion.label}</div>
              {suggestion.hint && (
                <div className="text-[11px] text-muted-foreground truncate">{suggestion.hint}</div>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>

          <div className="pt-1">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-hero transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
              <span>
                {paused ? "تم إيقاف التحويل" : `تحويل تلقائي خلال ${remaining} ث`}
              </span>
              {!paused ? (
                <button
                  onClick={() => setPaused(true)}
                  className="inline-flex items-center gap-1 font-bold hover:text-foreground"
                >
                  <X className="w-3 h-3" /> إلغاء
                </button>
              ) : (
                <button
                  onClick={() => {
                    setRemaining(autoSeconds);
                    setPaused(false);
                  }}
                  className="font-bold hover:text-foreground"
                >
                  استئناف
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Link
            to={suggestion.to}
            className="inline-flex items-center gap-2 bg-gradient-hero text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm shadow-glow"
          >
            افتح الآن
          </Link>
          <Link
            to={backTo.to}
            className="inline-flex items-center gap-1.5 bg-secondary text-foreground px-5 py-2.5 rounded-2xl font-bold text-sm"
          >
            <ArrowRight className="w-4 h-4" /> {backTo.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
