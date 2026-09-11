import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, Trash2, Bug } from "lucide-react";
import {
  clearPreviewErrors,
  readPreviewErrors,
  subscribePreviewErrors,
  type PreviewErrorEntry,
} from "@/lib/preview-errors";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/build-errors")({
  head: () => ({
    meta: [
      { title: "سجل أخطاء المعاينة — HkeeemAI" },
      {
        name: "description",
        content:
          "آخر أخطاء البناء والتشغيل التي ظهرت أثناء المعاينة مع وقتها والرسالة المعروضة للمستخدم.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildErrorsPage,
});

function BuildErrorsPage() {
  const { t, lang } = useI18n();
  const [entries, setEntries] = useState<PreviewErrorEntry[]>([]);

  useEffect(() => {
    setEntries(readPreviewErrors());
    return subscribePreviewErrors((next) => setEntries([...next]));
  }, []);

  const fmt = (at: number) =>
    new Date(at).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "medium",
    });

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center">
          <Bug className="w-6 h-6 text-secondary" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display font-black text-2xl md:text-3xl text-gold-shine">
            {t("errors.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("errors.subtitle")}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEntries(readPreviewErrors())}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs font-bold hover:bg-secondary"
        >
          <RotateCcw className="w-4 h-4 text-primary" />
          {t("errors.refresh")}
        </button>
        <button
          type="button"
          onClick={() => {
            clearPreviewErrors();
            setEntries([]);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs font-bold hover:bg-secondary"
        >
          <Trash2 className="w-4 h-4 text-primary" />
          {t("errors.clear")}
        </button>
        <span className="text-xs text-muted-foreground">{entries.length}</span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
          <p className="font-bold">{t("errors.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("errors.emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <time dateTime={new Date(e.at).toISOString()}>{fmt(e.at)}</time>
                    <span className="rounded-full bg-secondary/70 px-2 py-0.5 font-bold">
                      {e.source}
                    </span>
                    <span className="truncate font-mono">{e.route}</span>
                  </div>
                  <p className="text-sm font-bold">{e.userMessage}</p>
                  <p className="break-words font-mono text-xs text-muted-foreground">{e.message}</p>
                  {e.stack && (
                    <details>
                      <summary className="cursor-pointer text-[11px] text-primary">
                        {t("errors.details")}
                      </summary>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                        {e.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
